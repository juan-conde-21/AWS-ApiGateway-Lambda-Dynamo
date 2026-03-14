const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand
} = require('@aws-sdk/lib-dynamodb');

const region = process.env.AWS_REGION || 'us-east-1';

const ddbClient = new DynamoDBClient({ region });
const dynamodb = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true }
});

const dynamodbTableName = process.env.TABLE_NAME || 'product-inventory';
const healthPath = '/health';
const productPath = '/product';
const productsPath = '/products';

exports.handler = async function (event) {
  console.log('Request event: ', JSON.stringify(event));

  let response;

  // Compatibilidad básica (REST API / HTTP API)
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  const path = event.path || event.rawPath;

  try {
    switch (true) {
      case httpMethod === 'GET' && path === healthPath:
        response = buildResponse(200, { status: 'OK' });
        break;

      case httpMethod === 'GET' && path === productPath:
        response = await getProduct(event.queryStringParameters?.productId);
        break;

      case httpMethod === 'GET' && path === productsPath:
        response = await getProducts();
        break;

      case httpMethod === 'POST' && path === productPath:
        response = await saveProduct(parseBody(event.body));
        break;

      case httpMethod === 'PATCH' && path === productPath: {
        const requestBody = parseBody(event.body);
        response = await modifyProduct(
          requestBody.productId,
          requestBody.updateKey,
          requestBody.updateValue
        );
        break;
      }

      case httpMethod === 'DELETE' && path === productPath:
        response = await deleteProduct(parseBody(event.body).productId);
        break;

      default:
        response = buildResponse(404, '404 Not Found');
    }
  } catch (error) {
    console.error('Unhandled error in handler:', error);
    response = buildResponse(500, {
      message: 'Internal Server Error',
      error: error.message || 'Unknown error'
    });
  }

  return response;
};

async function getProduct(productId) {
  if (!productId) {
    return buildResponse(400, { message: 'productId is required' });
  }

  const params = {
    TableName: dynamodbTableName,
    Key: {
      productId: productId
    }
  };

  try {
    const response = await dynamodb.send(new GetCommand(params));
    return buildResponse(200, response.Item || {});
  } catch (error) {
    console.error('Error getting product:', error);
    return buildResponse(500, { message: 'Error getting product', error: error.message });
  }
}

async function getProducts() {
  const params = {
    TableName: dynamodbTableName
  };

  try {
    const allProducts = await scanDynamoRecords(params, []);
    const body = {
      products: allProducts
    };
    return buildResponse(200, body);
  } catch (error) {
    console.error('Error getting products:', error);
    return buildResponse(500, { message: 'Error getting products', error: error.message });
  }
}

async function scanDynamoRecords(scanParams, itemArray) {
  try {
    const dynamoData = await dynamodb.send(new ScanCommand(scanParams));
    itemArray = itemArray.concat(dynamoData.Items || []);

    if (dynamoData.LastEvaluatedKey) {
      scanParams.ExclusiveStartKey = dynamoData.LastEvaluatedKey; // <-- corregido
      return await scanDynamoRecords(scanParams, itemArray);
    }

    return itemArray;
  } catch (error) {
    console.error('Error scanning records:', error);
    throw error;
  }
}

async function saveProduct(requestBody) {
  if (!requestBody || typeof requestBody !== 'object') {
    return buildResponse(400, { message: 'Invalid request body' });
  }

  const params = {
    TableName: dynamodbTableName,
    Item: requestBody
  };

  try {
    await dynamodb.send(new PutCommand(params));

    const body = {
      Operation: 'SAVE',
      Message: 'SUCCESS',
      Item: requestBody
    };

    return buildResponse(200, body);
  } catch (error) {
    console.error('Error saving product:', error);
    return buildResponse(500, { message: 'Error saving product', error: error.message });
  }
}

async function modifyProduct(productId, updateKey, updateValue) {
  if (!productId || !updateKey) {
    return buildResponse(400, { message: 'productId and updateKey are required' });
  }

  const params = {
    TableName: dynamodbTableName,
    Key: {
      productId: productId
    },
    UpdateExpression: 'SET #uk = :value',
    ExpressionAttributeNames: {
      '#uk': updateKey
    },
    ExpressionAttributeValues: {
      ':value': updateValue
    },
    ReturnValues: 'UPDATED_NEW'
  };

  try {
    const response = await dynamodb.send(new UpdateCommand(params));

    const body = {
      Operation: 'UPDATE',
      Message: 'SUCCESS',
      UpdatedAttributes: response.Attributes || {}
    };

    return buildResponse(200, body);
  } catch (error) {
    console.error('Error updating product:', error);
    return buildResponse(500, { message: 'Error updating product', error: error.message });
  }
}

async function deleteProduct(productId) {
  if (!productId) {
    return buildResponse(400, { message: 'productId is required' });
  }

  const params = {
    TableName: dynamodbTableName,
    Key: {
      productId: productId
    },
    ReturnValues: 'ALL_OLD'
  };

  try {
    const response = await dynamodb.send(new DeleteCommand(params));

    const body = {
      Operation: 'DELETE',
      Message: 'SUCCESS',
      Item: response.Attributes || {}
    };

    return buildResponse(200, body);
  } catch (error) {
    console.error('Error deleting product:', error);
    return buildResponse(500, { message: 'Error deleting product', error: error.message });
  }
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  return JSON.parse(body);
}

function buildResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body ?? {})
  };
}
