/* Amplify Params - DO NOT EDIT
	AUTH_CLOUDSTORAGE029CBF24_USERPOOLID
	ENV
	REGION
	STORAGE_STORAGEDYNAMO_ARN
	STORAGE_STORAGEDYNAMO_NAME
	STORAGE_STORAGEDYNAMO_STREAMARN
	STORAGE_CLOUDSTORAGEBUCKET_BUCKETNAME
Amplify Params - DO NOT EDIT */

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { decodeProtectedHeader, importJWK, jwtVerify } = require("jose");
const https = require('https');
const Busboy = require('busboy');
const { Writable } = require('stream');
const { 
  v1: uuidv1,
  v4: uuidv4,
} = require('uuid');
const region = process.env.REGION;
const userPoolId = process.env.AUTH_CLOUDSTORAGE029CBF24_USERPOOLID;
const bucketName = process.env.STORAGE_CLOUDSTORAGEBUCKET_BUCKETNAME;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB file size limit

const s3Client = new S3Client({ region });
const ddbClient = new DynamoDBClient({ region });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

exports.handler = async (event) => {
  console.log('Event received:', event);

  const isBase64Encoded = event.isBase64Encoded;
  const headers = event.headers || {};
  const token = headers['Authorization'] || headers['authorization'];
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Missing or invalid Authorization header' }),
    };
  }


  // Fetch JWKS from Cognito
  const jwksUri = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  let jwks;
  try {
    jwks = await fetchJWKS(jwksUri);
  } catch (err) {
    console.error('Error fetching JWKS:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch JWKS' }),
    };
  }

  // Verify the token using Cognito JWKS
  let decodedToken;
  try {
    decodedToken = await verifyTokenWithCognitoJWKS(token, jwks, region, userPoolId);
  } catch (err) {
    console.error('Token verification failed:', err);
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid token' }),
    };
  }

  const userId = decodedToken.sub;
  console.log('userId received:', userId);

  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Token does not contain a valid sub claim' }),
    };
  }

  // Check body
  if (!isBase64Encoded || !event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Body missing or not base64 encoded' }),
    };
  }

  const binaryData = Buffer.from(event.body, 'base64');
  const contentType = headers['Content-Type'] || headers['content-type'];
  if (!contentType || !contentType.startsWith('multipart/form-data')) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Content-Type must be multipart/form-data' }),
    };
  }

  let fileName, fileType, size, fileBuffer;
console.log("before busboy")
  const busboy =  Busboy({ headers  : { "content-type": contentType}});

  const parsePromise = new Promise((resolve, reject) => {
    busboy.on('field', (fieldname, val) => {
      if (fieldname === 'fileName') fileName = val;
      if (fieldname === 'fileType') fileType = val;
      if (fieldname === 'size') size = val;
    });

    busboy.on('file', (fieldname, fileStream) => {
      if (fieldname === 'file') {
        const chunks = [];
        fileStream.on('data', chunk => chunks.push(chunk));
        fileStream.on('end', () => {
          fileBuffer = Buffer.concat(chunks);
        });
      }
    });

    busboy.on('finish', () => resolve());
    busboy.on('error', (err) => reject(err));
  });

  const input = new Writable({
    write(chunk, enc, cb) {
      busboy.write(chunk, enc, cb);
    }
  });

  input.on('finish', () => {
    busboy.end();
  });

  input.end(binaryData);
  await parsePromise;

  // Validate required fields
  if (!fileName || !fileType || !size || !fileBuffer) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields (fileName, fileType, size, or file).' }),
    };
  }

  const fileSize = parseInt(size, 10);
  if (isNaN(fileSize)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid size parameter." }),
    };
  }

  // Server-side file size check
  if (fileBuffer.length > MAX_FILE_SIZE) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'File size exceeds 10 MB limit.' }),
    };
  }

  const timestamp = new Date().toISOString();
  const fileId = uuidv4();

  // Directly upload the file to S3
  try {
    console.log("About to start upload....file to s3 for file ID:::",fileId)
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: `${userId}/${fileId}-${fileName}`,
      Body: fileBuffer,
      ContentType: fileType
    }));
  } catch (uploadErr) {
    console.log('Error uploading file to S3:', uploadErr);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error uploading file to S3' }),
    };
  }

  // Store metadata in DynamoDB
  const dbParams = {
    TableName: process.env.STORAGE_STORAGEDYNAMO_NAME,
    Item: {
      userId: userId,
      fileId: fileId,
      fileName: fileName,
      fileUrl: `https://${bucketName}.s3.amazonaws.com/${userId}/${fileId}-${fileName}`,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      sharedWith: [],
      isPublic: false,
      fileType: fileType,
      size: fileSize,
      tag: "Recent",
      isDeleted: false,
    },
  };
  try {
    console.log("updating to DB ............... ")

    await ddbDocClient.send(new PutCommand(dbParams));
  } catch (dbErr) {
    console.log('Error saving metadata to DynamoDB:', dbErr);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error saving file metadata' }),
    };
  }
console.log("successfull completed ")
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
      "Access-Control-Allow-Headers": "Content-Type"
    },
    body: JSON.stringify({ message: 'File uploaded successfully', fileName: fileName, fileId: fileId }),
  };
};

/**
 * Fetches the JWKS from Cognito well-known endpoint
 */
function fetchJWKS(jwksUri) {
  return new Promise((resolve, reject) => {
    https.get(jwksUri, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`JWKS request failed with status ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jwks = JSON.parse(data);
          resolve(jwks);
        } catch (parseErr) {
          reject(new Error('Failed to parse JWKS JSON'));
        }
      });
    }).on('error', (err) => reject(err));
  });
}

/**
 * Verifies the token using Cognito JWKS
 */
async function verifyTokenWithCognitoJWKS(token, jwks, region, userPoolId) {
  const protectedHeader = decodeProtectedHeader(token);
  const kid = protectedHeader.kid;

  const jwk = jwks.keys.find(key => key.kid === kid);
  if (!jwk) {
    throw new Error('Unable to find matching JWK for token');
  }

  const publicKey = await importJWK(jwk, jwk.alg || 'RS256');
  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

  const { payload } = await jwtVerify(token, publicKey, {
    issuer: issuer
    // audience: 'your-audience' if needed
  });

  return payload;
}
