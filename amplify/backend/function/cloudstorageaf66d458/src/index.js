/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
// Initialize AWS SDK v3 Clients
const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);


exports.handler = async (event) => {
  console.log("Received event:", event);

  try {
    // Parse the request body
    let { userId, fileId, shareWith, isPublic } = event;
    console.log("Received event:1", event);

    if (isPublic && typeof isPublic === 'string') {
      isPublic = isPublic.toLowerCase() === 'true';
    }
    // Validate input: at least one of shareWith or isPublic should be provided
    if (!shareWith && typeof isPublic !== 'boolean') {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Invalid JSON body: 'shareWith' or 'isPublic' is required." }),
      };
    }

    const tableName = process.env.STORAGE_STORAGEDYNAMO_NAME;

    // Fetch existing file metadata to ensure the file exists and belongs to the user
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
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "File not found." }),
      };
    }

    const fileMetadata = data.Item;

    // Validate ownership
    if (fileMetadata.userId !== userId) {
      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "You do not have permission to share this file." }),
      };
    }

    // Prepare UpdateExpression and ExpressionAttributeValues based on provided fields
    let updateExpression = "set updatedAt = :updatedAt";
    const expressionAttributeValues = {
      ":updatedAt": new Date().toISOString(),
    };

    if (shareWith) {
      updateExpression += ", sharedWith = list_append(sharedWith, :shareWith)";
      expressionAttributeValues[":shareWith"] = Array.isArray(shareWith) ? shareWith : [shareWith];
    }

    if (typeof isPublic === 'boolean') {
      updateExpression += ", isPublic = :isPublic";
      expressionAttributeValues[":isPublic"] = isPublic;
    }

    const updateParams = {
      TableName: tableName,
      Key: {
        userId: userId,
        fileId: fileId,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "UPDATED_NEW",
    };

    const updateCommand = new UpdateCommand(updateParams);
    const updateResult = await ddbDocClient.send(updateCommand);

    // If the file is shared publicly, construct the public URL
    let publicURL = null;
    if (isPublic) {
      publicURL=`https://0d2uv8jpwh.execute-api.us-east-1.amazonaws.com/dev/files/public-download/${fileId}`
    }

    // Prepare the response
    const responseBody = {
      message: "File shared successfully.",
      data: updateResult.Attributes,
    };

    if (publicURL) {
      responseBody.publicURL = publicURL;
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error("Error sharing file:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Internal Server Error." }),
    };
  }
};
