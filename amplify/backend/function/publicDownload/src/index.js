/* Amplify Params - DO NOT EDIT
	AUTH_CLOUDSTORAGE029CBF24_USERPOOLID
	ENV
	REGION
	STORAGE_STORAGEDYNAMO_ARN
	STORAGE_STORAGEDYNAMO_NAME
	STORAGE_STORAGEDYNAMO_STREAMARN
	STORAGE_CLOUDSTORAGEBUCKET_BUCKETNAME
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
// amplify/backend/function/fileDownload/src/index.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

// Initialize AWS SDK v3 Clients
const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const s3Client = new S3Client({ region: process.env.REGION });

exports.handler = async (event) => {
  try {
    // Parse the request body

    console.log(event,"event::::::",event)
    const { fileId } = event.pathParameters || {};

    // Validate input
    if (!fileId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "fileId is required" }),
      };
    }

    // DynamoDB table name
    const tableName = process.env.STORAGE_STORAGEDYNAMO_NAME;

    // Fetch file metadata from DynamoDB
    const queryParams = {
      TableName: tableName,
      IndexName: 'fileId-index',            // Specify the GSI name
      KeyConditionExpression: 'fileId = :f', // Condition on the GSI partition key
      ExpressionAttributeValues: {
        ':f': fileId,                       // Value to match for fileId
      },
      Limit: 1                              // Optional: If you only expect one item
    };
    let item;
    const queryCommand = new QueryCommand(queryParams);
    try {
      const data = await ddbDocClient.send(queryCommand);
    
      if (data.Items && data.Items.length > 0) {
         item = data.Items[0];
        console.log('Item found:', item);
        // Process the retrieved item as needed
      } else {
        console.log('No item found for the given fileId.');
      }
    } catch (error) {
      console.error("Error querying item by fileId:", error);
    }
    if (!item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "File not found" }),
      };
    }

    const fileMetadata = item;

    // Validate ownership or access via 'sharedWith'
    const hasAccess = fileMetadata.isPublic 

    if (!hasAccess) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "You do not have permission to download this file" }),
      };
    }

    // Check if the file is marked as deleted
    if (fileMetadata.isDeleted) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "File is marked as deleted and cannot be downloaded" }),
      };
    }

    

    // Fetch the file from S3
    const bucketName = process.env.STORAGE_CLOUDSTORAGEBUCKET_BUCKETNAME;
    const destinationKey = `${fileMetadata.userId}/${fileId}-${fileMetadata.fileName}`;


    const getObjectParams = {
      Bucket: bucketName,
      Key: destinationKey,
    };

    const getObjectCommand = new GetObjectCommand(getObjectParams);
    const s3Response = await s3Client.send(getObjectCommand);

    // Read the stream into a buffer
    const stream = s3Response.Body;
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const fileContent = Buffer.concat(chunks);

    // Determine the MIME type
    const mimeType = fileMetadata.fileType || 'application/octet-stream';

    // Encode the file content to Base64
    const base64File = fileContent.toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileMetadata.fileName}"`,
        "Access-Control-Allow-Origin": "*", // CORS header

      },
      isBase64Encoded: true,
      body: base64File,
    };
    
  } catch (error) {
    console.error("Error downloading file:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
