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
// amplify/backend/function/fileUpload/src/index.js

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { userId, fileName, fileType, size } = JSON.parse(event.body);
  const bucketName = process.env.STORAGE_CLOUDSTORAGEBUCKET_BUCKETNAME;
  const timestamp = new Date().toISOString();
  const fileId = `${fileName}-${timestamp}`;
  
  const params = {
    Bucket: bucketName,
    Key: fileName,
    ContentType: fileType,
    Expires: 60 * 5,
  };

  try {
    // Generate presigned URL
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    
    // Save metadata in DynamoDB
    const dbParams = {
      TableName: process.env.STORAGE_FILEMETADATA_NAME,
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
        size: size,
      },
    };

    await dynamodb.put(dbParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ uploadUrl }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
