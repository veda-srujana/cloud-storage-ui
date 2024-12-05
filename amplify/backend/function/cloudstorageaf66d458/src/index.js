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
 */// amplify/backend/function/fileShare/src/index.js

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { userId, fileId, shareWith, isPublic } = JSON.parse(event.body);

  const updateParams = {
    TableName: process.env.STORAGE_FILEMETADATA_NAME,
    Key: {
      userId: userId,
      fileId: fileId,
    },
    UpdateExpression: "set sharedWith = list_append(sharedWith, :shareWith), isPublic = :isPublic, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":shareWith": shareWith ? [shareWith] : [],
      ":isPublic": isPublic,
      ":updatedAt": new Date().toISOString(),
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    const data = await dynamodb.update(updateParams).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "File shared successfully", data }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
