

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
// File: index.js

const { CognitoIdentityProviderClient, ListUsersCommand } = require("@aws-sdk/client-cognito-identity-provider");

exports.handler = async (event) => {
  const userPoolId = process.env.AUTH_CLOUDSTORAGE029CBF24_USERPOOLID;
  const maxResults = 60; // Maximum allowed by Cognito per request

  const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

  let users = [];
  let paginationToken = null;

  try {
    do {
      const params = {
        UserPoolId: userPoolId,
        Limit: maxResults,
        ...(paginationToken && { PaginationToken: paginationToken }),
      };

      const command = new ListUsersCommand(params);
      const response = await client.send(command);

      users = users.concat(response.Users);

      paginationToken = response.PaginationToken;
    } while (paginationToken);

    // Format the users data as needed
    const formattedUsers = users.map(user => ({
      userId: user.Username,
      attributes: user.Attributes.reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {}),
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ users: formattedUsers }),
    };
  } catch (error) {
    console.error('Error listing users:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Failed to list users' }),
    };
  }
};

