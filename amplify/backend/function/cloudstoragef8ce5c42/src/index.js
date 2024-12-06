/* Amplify Params - DO NOT EDIT
	AUTH_CLOUDSTORAGE029CBF24_USERPOOLID
	ENV
	REGION
	STORAGE_STORAGEDYNAMO_ARN
	STORAGE_STORAGEDYNAMO_NAME
	STORAGE_STORAGEDYNAMO_STREAMARN
	STORAGE_CLOUDSTORAGEBUCKET_BUCKETNAME
Amplify Params - DO NOT EDIT */

const { S3Client } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { decodeJwt, importJWK, JWTPayload, jwtVerify } = require("jose");
const https = require('https');
const s3Client = new S3Client({ region: process.env.REGION });
const dbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = new DynamoDBDocumentClient(dbClient);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB file size limit

exports.handler = async (event) => {
  console.log('Event received:', event);
  const file = event.body;
  const region = process.env.REGION;
  const userPoolId = process.env.AUTH_CLOUDSTORAGE029CBF24_USERPOOLID;
  const bucketName = process.env.STORAGE_CLOUDSTORAGEBUCKET_BUCKETNAME;

  const isBase64Encoded = event.isBase64Encoded;
  const headers = event.headers || {};

  // 1. Extract token from the Authorization header
  const token = headers['Authorization'] || headers['authorization'];
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Missing or invalid Authorization header' }),
    };
  }
 
  console.log("UserpoolID::", userPoolId)
  console.log("token::", token)


  // Extract userId from the user object
//  2. Fetch the JWKS from Cognito
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

  // 3. Verify the token using Cognito JWKS
  let decodedToken;
  try {
    decodedToken = await verifyTokenWithCognitoJWKS(token, jwks);
  } catch (err) {
    console.error('Token verification failed:', err);
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid token' }),
    };
  }

  // Extract userId (sub) from the token
  const userId = decodedToken.sub;
  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Token does not contain a valid sub claim' }),
    };
  }
console.log("userId",userId)
  // 4. Check body/base64 and content type
  if (!isBase64Encoded || !event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Body missing or not base64 encoded' }),
    };
  }

  // const binaryData = Buffer.from(event.body, 'base64');
  const { filedata } = event;
  const fileBuffer = Buffer.from(filedata, 'base64');
  const fileSize = buffer.length;
  const fileType = buffer.type; 
  

 

  
  // Validate required fields
  if (!fileName || !fileType || !size || !fileBuffer) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields (fileName, fileType, size, or file).' }),
    };
  }

  if (isNaN(fileSize)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid size parameter." }),
    };
  }

  // Server-side file size validation
  if (fileBuffer.length > MAX_FILE_SIZE) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'File size exceeds 10 MB limit.' }),
    };
  }

  const timestamp = new Date().toISOString();
  const fileId = `${fileName}-${timestamp}`;

  // Generate a presigned URL for S3 PUT
  const s3Params = {
    Bucket: bucketName,
    Key: userId+"/"+fileName,
    ContentType: fileType,
    Expires: 60 * 5, // 5 minutes
  };
  const uploadUrl = await s3Client.getSignedUrlPromise('putObject', s3Params);

  // Store metadata in DynamoDB
  const dbParams = {
    TableName: process.env.STORAGE_STORAGEDYNAMO_NAME,
    Item: {
      userId: userId,
      fileId: fileId,
      fileName: fileName,
      fileUrl: `https://${bucketName}.s3.amazonaws.com/${fileName}`,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      sharedWith: [],
      isPublic: false,
      fileType: fileType,
      size: fileSize,
      tag: "Recent"
    },
  };
  await ddbDocClient.put(dbParams).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ uploadUrl }),
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
async function verifyTokenWithCognitoJWKS(token, jwks) {
  const { header } = decodeJwt(token, { complete: true });
  const kid = header.kid;
  

  const jwk = jwks.keys.find(key => key.kid === kid);
  if (!jwk) {
    throw new Error('Unable to find matching JWK for token');
  }

  const publicKey = await importJWK(jwk, jwk.alg || 'RS256');
  const { payload } = await jwtVerify(token, publicKey, {
     issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
    // audience: 'your-audience'
  });

  return payload;
}
