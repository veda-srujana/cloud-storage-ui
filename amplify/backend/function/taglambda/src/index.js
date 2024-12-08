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
// amplify/backend/function/fileChangeTag/src/index.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
// S3 is optional; remove if not needed
// const { S3Client } = require("@aws-sdk/client-s3");

// Initialize AWS SDK v3 Clients
const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// Initialize S3 Client if needed
// const s3Client = new S3Client({ region: process.env.REGION });

exports.handler = async (event) => {
  try {
    // Parse the request body
    console.log("event:::", event);

    const { fileId, newTag, userId } = event;

    // Validate input
    if (!fileId || !newTag) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "fileId and newTag are required" }),
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

    // Validate ownership or access via 'sharedWith'
    const isOwner = fileMetadata.userId === userId;
    const sharedWith = fileMetadata.sharedWith || [];
    const hasAccess = isOwner || sharedWith.includes(userId);

    if (!hasAccess) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "You do not have permission to change the tag of this file" }),
      };
    }

    // Optional: Validate the newTag against a list of allowed tags
    const allowedTags = ["Recent", "Star", "Important", "Personal", "Work"]; // Customize as needed
    if (!(newTag)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: `Invalid tag. Tag can't be empty` }),
      };
    }

    // Update the 'tag' attribute in DynamoDB
    const updateParams = {
      TableName: tableName,
      Key: {
        userId: userId,
        fileId: fileId,
      },
      UpdateExpression: "set #tag = :newTag, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#tag": "tag", // 'tag' might be a reserved word; aliasing it
      },
      ExpressionAttributeValues: {
        ":newTag": newTag,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "UPDATED_NEW",
    };

    const updateCommand = new UpdateCommand(updateParams);
    const updateResult = await ddbDocClient.send(updateCommand);

    return {
      statusCode: 200,
      body: {
        message: "File tag updated successfully",
        updatedAttributes: updateResult.Attributes,
      },
    };
  } catch (error) {
    console.error("Error updating file tag:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
