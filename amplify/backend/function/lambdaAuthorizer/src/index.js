

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_4cQjUlZPN/.well-known/jwks.json',
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

exports.handler = (event, context, callback) => {
  const token = event.authorizationToken.split(' ')[1]; // Extract JWT token
  
  jwt.verify(token, getKey, {}, (err, decoded) => {
    if (err) {
      callback('Unauthorized');
    } else {
      callback(null, generatePolicy(decoded.sub, 'Allow', event.methodArn));
    }
  });
};

function generatePolicy(principalId, effect, resource) {
  const policyDocument = {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
      },
    ],
  };

  return {
    principalId,
    policyDocument,
  };
}

