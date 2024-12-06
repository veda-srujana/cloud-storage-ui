/* Amplify Params - DO NOT EDIT
	AUTH_CLOUDSTORAGE029CBF24_USERPOOLID
	ENV
	REGION
	STORAGE_STORAGEDYNAMO_ARN
	STORAGE_STORAGEDYNAMO_NAME
	STORAGE_STORAGEDYNAMO_STREAMARN
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */// amplify/backend/function/fileRename/src/index.js
/* Amplify Params - DO NOT EDIT
	AUTH_CLOUDSTORAGE029CBF24_USERPOOLID
	ENV
	REGION
	STORAGE_STORAGEDYNAMO_ARN
	STORAGE_STORAGEDYNAMO_NAME
	STORAGE_STORAGEDYNAMO_STREAMARN
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

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
// amplify/backend/function/fileRename/src/index.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, CopyObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

// Initialize AWS SDK v3 Clients
const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const s3Client = new S3Client({ region: process.env.REGION });

exports.handler = async (event) => {
  try {
    // Parse the request body
    const { userId, email, username, fileId , newFileName} = event;

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
    const getParams = {
      TableName: tableName,
      Key: {
        userId: userId,
        fileId: fileId,
      },
    };

    const getCommand = new GetCommand(getParams);
    const data = await ddbDocClient.send(getCommand);

    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "File not found" }),
      };
    }

    const fileMetadata = data.Item;

    // Validate ownership
    if (fileMetadata.userId !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "You do not have permission to rename this file" }),
      };
    }

    const bucketName = process.env.STORAGE_CLOUDSTORAGEBUCKET_BUCKETNAME;

    // Check if the newFileName already exists to prevent overwriting
    const headParams = {
      Bucket: bucketName,
      Key: `${userId}/${fileId}-${newFileName}`,
    };

    try {
      await s3Client.send(new HeadObjectCommand(headParams));
      // If no error, the file already exists
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "A file with the newFileName already exists" }),
      };
    } catch (headErr) {
      if (headErr.name !== 'NotFound') {
        // An unexpected error occurred
        throw headErr;
      }
      // File does not exist, proceed with renaming
    }

    // Copy file to new key in S3
    const copyParams = {
      Bucket: bucketName,
      CopySource: `${userId}/${fileId}-${fileMetadata.fileName}`,
      Key: `${userId}/${fileId}-${newFileName}`,
    };

    const copyCommand = new CopyObjectCommand(copyParams);
    await s3Client.send(copyCommand);

    // Delete old file in S3
    const deleteParams = {
      Bucket: bucketName,
      Key: `${userId}/${fileId}-${fileMetadata.fileName}`,
    };

    const deleteCommand = new DeleteObjectCommand(deleteParams);
    await s3Client.send(deleteCommand);
    const newFileUrl= `https://${bucketName}.s3.amazonaws.com/${userId}/${fileId}-${fileMetadata.fileName}`
    // Update file metadata in DynamoDB
    const updateParams = {
      TableName: tableName,
      Key: {
        userId: userId,
        fileId: fileId,
      },
      UpdateExpression: "set fileName = :newFileName, updatedAt = :updatedAt, fileUrl= :newFileUrl",
      ExpressionAttributeValues: {
        ":newFileName": newFileName,
        ":updatedAt": new Date().toISOString(),
        ":newFileUrl": newFileUrl,
      },
      ReturnValues: "UPDATED_NEW",
    };

    const updateCommandDynamoDB = new UpdateCommand(updateParams);
    const updateResult = await ddbDocClient.send(updateCommandDynamoDB);

    return {
      statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
      "Access-Control-Allow-Headers": "Content-Type"
    },
      body: JSON.stringify({
        message: "File renamed successfully",
        updatedAttributes: updateResult.Attributes,
      }),
    };
  } catch (error) {
    console.error("Error renaming file:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
