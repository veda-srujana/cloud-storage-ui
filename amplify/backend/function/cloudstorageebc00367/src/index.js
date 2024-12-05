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

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { userId, fileId, newFileName } = JSON.parse(event.body);

  // Fetch file metadata
  const getParams = {
    TableName: process.env.STORAGE_FILEMETADATA_NAME,
    Key: {
      userId: userId,
      fileId: fileId,
    },
  };

  try {
    const data = await dynamodb.get(getParams).promise();

    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "File not found" }),
      };
    }

    const fileMetadata = data.Item;

    // Copy file to new key in S3
    const copyParams = {
      Bucket: process.env.STORAGE_CLOUDSTORAGEBUCKET_BUCKETNAME,
      CopySource: `${process.env.STORAGE_CLOUDSTORAGEBUCKET_BUCKETNAME}/${fileMetadata.fileName}`,
      Key: newFileName,
    };

    await s3.copyObject(copyParams).promise();

    // Delete old file in S3
    const deleteParams = {
      Bucket: process.env.STORAGE_CLOUDSTORAGEBUCKET_BUCKETNAME,
      Key: fileMetadata.fileName,
    };

    await s3.deleteObject(deleteParams).promise();

    // Update file metadata in DynamoDB
    const updateParams = {
      TableName: process.env.STORAGE_FILEMETADATA_NAME,
      Key: {
        userId: userId,
        fileId: fileId,
      },
      UpdateExpression: "set fileName = :newFileName, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":newFileName": newFileName,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "UPDATED_NEW",
    };

    await dynamodb.update(updateParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "File renamed successfully" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
