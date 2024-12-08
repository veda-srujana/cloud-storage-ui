

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

    console.log("userss:::",users)

    console.log("userss:attribute::",users[0].Attributes)

    // Format the users data as needed
    const formattedUsers = users.map(user => {
        // Convert the Attributes array into a key-value object
        const attrs = user.Attributes.reduce((acc, { Name, Value }) => {
          acc[Name] = Value;
          return acc;
        }, {});
      
        return {
          userId: user.Username,
          email: attrs.email,
          given_name: attrs.given_name,
          family_name: attrs.family_name,
        };
      });
      

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: { users: formattedUsers },
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

