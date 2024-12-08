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
 */// amplify/backend/function/fileDelete/src/index.js
// File: index.js

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

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

// Initialize DynamoDB Document Client
const client = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    // Parse the request body
    const { userId, email, username, fileId } = event;

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

    // Check if the current user is the owner or has access via 'sharedWith'
    const isOwner = data.Item.userId === userId;
    //const sharedWith = data.Item.sharedWith || [];
    const hasAccess = isOwner ;
    //|| sharedWith.includes(userId);

    if (!hasAccess) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "Access denied" }),
      };
    }

    // Check if the file is already marked as deleted
    if (data.Item.isDeleted) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "File is already deleted" }),
      };
    }

    // Update the 'isDeleted' attribute to true
    const updateParams = {
      TableName: tableName,
      Key: {
        userId: userId,
        fileId: fileId,
      },
      UpdateExpression: "set isDeleted = :val, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":val": true,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "UPDATED_NEW",
    };

    const updateCommand = new UpdateCommand(updateParams);
    const updateResult = await ddbDocClient.send(updateCommand);

    return {
        statusCode: 200,
      body: {
        message: "File marked as deleted successfully",
        updatedAttributes: updateResult.Attributes,
      },
    };
  } catch (error) {
    console.error("Error marking file as deleted:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
