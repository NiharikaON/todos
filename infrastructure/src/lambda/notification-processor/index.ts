import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

const { NOTIFICATIONS_TABLE, SNS_TOPIC_ARN } = process.env;

export const handler = async (event: any) => {
  console.log('Received event:', JSON.stringify(event));

  const detailType = event['detail-type'];
  const detail = event.detail;

  if (!NOTIFICATIONS_TABLE || !SNS_TOPIC_ARN) {
    throw new Error('Missing environment variables');
  }

  let title = '';
  let message = '';
  let userId = detail.userId || detail.ownerId || detail.owner;

  if (!userId) {
    console.warn('No userId/ownerId found in event detail, skipping notification.');
    return;
  }

  switch (detailType) {
    case 'TodoCreated':
      title = 'New Task Created';
      message = `Task "${detail.title}" was created.`;
      break;
    case 'TodoOverdue':
      title = 'Task Overdue';
      message = `Task "${detail.title}" is overdue.`;
      break;
    case 'ProjectCreated':
      title = 'New Project Created';
      message = `Project "${detail.name}" was created.`;
      break;
    case 'TodoDueSoon':
      title = 'Task Due Soon';
      message = `Reminder: Task "${detail.title}" is due in less than 24 hours.`;
      break;
    default:
      console.log(`No notification logic for event type: ${detailType}`);
      return;
  }

  const notification = {
    id: uuidv4(),
    userId,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString()
  };

  try {
    // 1. Save to DynamoDB
    await docClient.send(new PutCommand({
      TableName: NOTIFICATIONS_TABLE,
      Item: notification
    }));
    console.log('Saved notification to DynamoDB:', notification.id);

    // 2. Publish to SNS
    await snsClient.send(new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Message: JSON.stringify(notification),
      Subject: title,
      MessageAttributes: {
        userId: {
          DataType: 'String',
          StringValue: userId
        }
      }
    }));
    console.log('Published notification to SNS');
  } catch (error) {
    console.error('Error processing notification:', error);
    throw error;
  }
};
