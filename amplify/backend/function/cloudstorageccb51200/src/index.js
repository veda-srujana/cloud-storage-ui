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

// Import the DynamoDB client and utility functions from AWS SDK v3
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Create DynamoDB client
const dbClient = new DynamoDBClient({ region: process.env.REGION });
const dynamoDbDocClient = DynamoDBDocumentClient.from(dbClient);

exports.handler = async (event) => {
  try {
    console.log("event:::", event.requestContext);
    
    // Extract userId from Cognito authorizer claims
    if (!event.requestContext || !event.requestContext.authorizer || !event.requestContext.authorizer.claims) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized :::' }),
      };
    }

    const userId = event.requestContext.authorizer.claims.sub;
    console.log("userId:::", userId);

    // Extract query parameters
    const queryParams = event.queryStringParameters || {};
    console.log("queryParams:::", queryParams);

    const { tag, shared, public: isPublic } = queryParams;

    let filterExpression = '';
    let expressionAttributeValues = {
      ':userId': userId,
    };

    // Add filters for tag, shared status, or public files
    if (tag) {
      filterExpression += 'contains(tags, :tag)';
      expressionAttributeValues[':tag'] = tag;
    }

    if (shared === 'true') {
      filterExpression += filterExpression ? ' AND ' : '';
      filterExpression += 'size(sharedWith) > :zero';
      expressionAttributeValues[':zero'] = 0;
    }

    if (isPublic === 'true') {
      filterExpression += filterExpression ? ' AND ' : '';
      filterExpression += 'isPublic = :isPublic';
      expressionAttributeValues[':isPublic'] = true;
    }

    const params = {
      TableName: process.env.STORAGE_STORAGEDYNAMO_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: expressionAttributeValues,
    };

    if (filterExpression) {
      params.FilterExpression = filterExpression;
    }

    // Create a QueryCommand with the params
    const command = new QueryCommand(params);

    // Query DynamoDB using the DynamoDBDocumentClient
    const data = await dynamoDbDocClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };
  } catch (error) {
    console.error('Error fetching file metadata:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
