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
 */// amplify/backend/function/fileDownload/src/index.js

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { userId, fileId } = JSON.parse(event.body);

  // Fetch file metadata from DynamoDB
  const params = {
    TableName: process.env.STORAGE_FILEMETADATA_NAME,
    Key: {
      userId: userId,
      fileId: fileId,
    },
  };

  try {
    const data = await dynamodb.get(params).promise();

    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "File not found" }),
      };
    }

    const fileMetadata = data.Item;

    // Check if the user has permission to access the file
    if (fileMetadata.userId !== userId && !fileMetadata.sharedWith.includes(userId) && !fileMetadata.isPublic) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "Access denied" }),
      };
    }

    // Generate presigned URL for downloading the file
    const downloadUrl = await s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.STORAGE_CLOUDSTORAGEBUCKET_BUCKETNAME,
      Key: fileMetadata.fileName,
      Expires: 60 * 5,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ downloadUrl }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
