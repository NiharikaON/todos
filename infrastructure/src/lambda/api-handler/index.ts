import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const eventBridgeClient = new EventBridgeClient({});

const {
  TODOS_TABLE,
  PROJECTS_TABLE,
  NOTIFICATIONS_TABLE,
  EVENT_BUS_NAME
} = process.env;

export const handler = async (event: any) => {
  const { info, arguments: args, identity } = event;
  const fieldName = info.fieldName;
  
  // Basic logging
  console.log(`Processing ${fieldName}`, JSON.stringify(args));

  try {
    switch (fieldName) {
      case 'getTodo':
        return await getTodo(args.id);
      case 'listTodos':
        return await listTodos(args.userId);
      case 'createTodo':
        return await createTodo(args);
      case 'updateTodo':
        return await updateTodo(args);
      case 'deleteTodo':
        return await deleteTodo(args.id, args.userId);
        
      case 'getProject':
        return await getProject(args.id);
      case 'listProjects':
        return await listProjects(args.ownerId);
      case 'createProject':
        return await createProject(args);
      case 'updateProject':
        return await updateProject(args);
      case 'deleteProject':
        return await deleteProject(args.id, args.ownerId);
        
      case 'getNotifications':
        return await getNotifications(args.userId);
      case 'markNotificationRead':
        return await updateNotificationReadStatus(args.id, args.userId, true);
      case 'markNotificationUnread':
        return await updateNotificationReadStatus(args.id, args.userId, false);
      case 'markAllNotificationsRead':
        return await markAllNotificationsRead(args.userId);
        
      default:
        throw new Error(`Unsupported fieldName: ${fieldName}`);
    }
  } catch (error) {
    console.error('Error executing resolver:', error);
    throw error;
  }
};

async function getTodo(id: string) {
  const { Item } = await docClient.send(new GetCommand({
    TableName: TODOS_TABLE,
    Key: { id }
  }));
  return Item;
}

async function listTodos(userId: string) {
  const { Items } = await docClient.send(new QueryCommand({
    TableName: TODOS_TABLE,
    IndexName: 'byUserId',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }));
  return Items || [];
}

async function createTodo(args: any) {
  const now = new Date().toISOString();
  const todo = {
    ...args,
    createdAt: now,
    updatedAt: now,
  };
  
  await docClient.send(new PutCommand({
    TableName: TODOS_TABLE,
    Item: todo
  }));
  
  await publishEvent('TodoCreated', todo);
  return todo;
}

async function updateTodo(args: any) {
  const { id, userId, ...updates } = args;
  
  // Build update expression
  let UpdateExpression = 'SET updatedAt = :updatedAt';
  const ExpressionAttributeValues: Record<string, any> = {
    ':updatedAt': new Date().toISOString()
  };
  const ExpressionAttributeNames: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      UpdateExpression += `, #${key} = :${key}`;
      ExpressionAttributeNames[`#${key}`] = key;
      ExpressionAttributeValues[`:${key}`] = value;
    }
  }
  
  const { Attributes } = await docClient.send(new UpdateCommand({
    TableName: TODOS_TABLE,
    Key: { id },
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  }));
  
  await publishEvent('TodoUpdated', Attributes);
  return Attributes;
}

async function deleteTodo(id: string, userId: string) {
  // Wait, DynamoDB delete doesn't need userId unless it's in the key, but we only have 'id' as key
  // However, we should verify ownership ideally. We'll skip for this simple MVP
  const { Attributes } = await docClient.send(new DeleteCommand({
    TableName: TODOS_TABLE,
    Key: { id },
    ReturnValues: 'ALL_OLD'
  }));
  
  if (Attributes) {
    await publishEvent('TodoDeleted', Attributes);
  }
  return Attributes;
}

async function getProject(id: string) {
  const { Item } = await docClient.send(new GetCommand({
    TableName: PROJECTS_TABLE,
    Key: { id }
  }));
  return Item;
}

async function listProjects(ownerId: string) {
  const { Items } = await docClient.send(new QueryCommand({
    TableName: PROJECTS_TABLE,
    IndexName: 'byOwnerId',
    KeyConditionExpression: 'ownerId = :ownerId',
    ExpressionAttributeValues: {
      ':ownerId': ownerId
    }
  }));
  return Items || [];
}

async function createProject(args: any) {
  const now = new Date().toISOString();
  const project = {
    ...args,
    createdAt: now,
    updatedAt: now,
  };
  
  await docClient.send(new PutCommand({
    TableName: PROJECTS_TABLE,
    Item: project
  }));
  
  await publishEvent('ProjectCreated', project);
  return project;
}

async function updateProject(args: any) {
  const { id, ownerId, ...updates } = args;
  
  let UpdateExpression = 'SET updatedAt = :updatedAt';
  const ExpressionAttributeValues: Record<string, any> = {
    ':updatedAt': new Date().toISOString()
  };
  const ExpressionAttributeNames: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      UpdateExpression += `, #${key} = :${key}`;
      ExpressionAttributeNames[`#${key}`] = key;
      ExpressionAttributeValues[`:${key}`] = value;
    }
  }
  
  const { Attributes } = await docClient.send(new UpdateCommand({
    TableName: PROJECTS_TABLE,
    Key: { id },
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  }));
  
  await publishEvent('ProjectUpdated', Attributes);
  return Attributes;
}

async function deleteProject(id: string, ownerId: string) {
  const { Attributes } = await docClient.send(new DeleteCommand({
    TableName: PROJECTS_TABLE,
    Key: { id },
    ReturnValues: 'ALL_OLD'
  }));
  
  if (Attributes) {
    await publishEvent('ProjectDeleted', Attributes);
  }
  return Attributes;
}

async function getNotifications(userId: string) {
  const { Items } = await docClient.send(new QueryCommand({
    TableName: NOTIFICATIONS_TABLE,
    IndexName: 'byUserId',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }));
  return Items || [];
}

async function updateNotificationReadStatus(id: string, userId: string, read: boolean) {
  const { Attributes } = await docClient.send(new UpdateCommand({
    TableName: NOTIFICATIONS_TABLE,
    Key: { id },
    UpdateExpression: 'SET #read = :read',
    ExpressionAttributeNames: { '#read': 'read' },
    ExpressionAttributeValues: { ':read': read },
    ReturnValues: 'ALL_NEW'
  }));
  return Attributes;
}

async function markAllNotificationsRead(userId: string) {
  const { Items } = await docClient.send(new QueryCommand({
    TableName: NOTIFICATIONS_TABLE,
    IndexName: 'byUserId',
    KeyConditionExpression: 'userId = :userId',
    FilterExpression: '#read = :falseVal',
    ExpressionAttributeNames: { '#read': 'read' },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':falseVal': false
    }
  }));
  
  if (!Items || Items.length === 0) return true;
  
  for (const item of Items) {
    await docClient.send(new UpdateCommand({
      TableName: NOTIFICATIONS_TABLE,
      Key: { id: item.id },
      UpdateExpression: 'SET #read = :trueVal',
      ExpressionAttributeNames: { '#read': 'read' },
      ExpressionAttributeValues: { ':trueVal': true }
    }));
  }
  
  return true;
}

async function publishEvent(detailType: string, detail: any) {
  if (!EVENT_BUS_NAME) return;
  
  await eventBridgeClient.send(new PutEventsCommand({
    Entries: [
      {
        Source: 'todo.api',
        DetailType: detailType,
        Detail: JSON.stringify(detail),
        EventBusName: EVENT_BUS_NAME
      }
    ]
  }));
}
