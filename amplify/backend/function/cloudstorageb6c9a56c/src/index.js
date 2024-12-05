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

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { userId, fileId } = JSON.parse(event.body);
  const bucketName = process.env.STORAGE_CLOUDSTORAGEBUCKET_BUCKETNAME;

  try {
    // Fetch file metadata from DynamoDB
    const getParams = {
      TableName: process.env.STORAGE_FILEMETADATA_NAME,
      Key: {
        userId: userId,
        fileId: fileId,
      },
    };

    const data = await dynamodb.get(getParams).promise();

    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "File not found" }),
      };
    }

    const fileName = data.Item.fileName;

    // Delete the file from S3
    const deleteParamsS3 = {
      Bucket: bucketName,
      Key: fileName,
    };

    await s3.deleteObject(deleteParamsS3).promise();

    // Delete the metadata from DynamoDB
    const deleteParamsDynamoDB = {
      TableName: process.env.STORAGE_FILEMETADATA_NAME,
      Key: {
        userId: userId,
        fileId: fileId,
      },
    };

    await dynamodb.delete(deleteParamsDynamoDB).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "File deleted successfully" }),
    };
  } catch (error) {
    console.error("Error deleting file:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
