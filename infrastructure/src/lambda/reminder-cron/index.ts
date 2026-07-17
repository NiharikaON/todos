import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const eventBridgeClient = new EventBridgeClient({});

const { TODOS_TABLE, EVENT_BUS_NAME } = process.env;

export const handler = async () => {
  console.log('Reminder cron started');

  const now = new Date();
  const runIntervalMs = 5 * 60 * 1000; // 5 minutes
  
  // Since we scan everything that isn't completed, this can get heavy over time.
  // Ideally, we'd use a GSI on status/dueDate, but for now we'll scan and filter.

  try {
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;
    let dueTasks = [];

    do {
      const response: any = await docClient.send(new ScanCommand({
        TableName: TODOS_TABLE,
        FilterExpression: 'attribute_exists(dueDate) AND #status <> :completed',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':completed': 'COMPLETED'
        },
        ExclusiveStartKey: lastEvaluatedKey
      }));

      if (response.Items) {
        dueTasks.push(...response.Items);
      }
      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    const entries = [];

    for (const task of dueTasks) {
      if (!task.dueDate) continue;
      
      const due = new Date(task.dueDate).getTime();
      const setting = task.reminderSetting || 'NONE';
      
      if (setting === 'NONE') continue;

      let offsetMs = 0;
      switch (setting) {
        case '0_MIN': offsetMs = 0; break;
        case '5_MIN': offsetMs = 5 * 60 * 1000; break;
        case '15_MIN': offsetMs = 15 * 60 * 1000; break;
        case '30_MIN': offsetMs = 30 * 60 * 1000; break;
        case '1_HOUR': offsetMs = 60 * 60 * 1000; break;
        case '1_DAY': offsetMs = 24 * 60 * 60 * 1000; break;
      }

      const triggerTime = due - offsetMs;
      const timeUntilTrigger = triggerTime - now.getTime();

      // If the trigger time is within the current 5-minute interval
      if (timeUntilTrigger >= 0 && timeUntilTrigger < runIntervalMs) {
        entries.push({
          Source: 'todo.cron',
          DetailType: 'TodoDueSoon',
          Detail: JSON.stringify({ ...task, timeframe: setting }),
          EventBusName: EVENT_BUS_NAME
        });
      }
    }

    console.log(`Found ${entries.length} tasks needing reminders this interval`);

    if (entries.length > 0 && EVENT_BUS_NAME) {
      // PutEvents allows max 10 entries per request
      for (let i = 0; i < entries.length; i += 10) {
        const batch = entries.slice(i, i + 10);
        await eventBridgeClient.send(new PutEventsCommand({ Entries: batch }));
      }
    }

    console.log('Reminder cron finished successfully');
  } catch (error) {
    console.error('Error in reminder cron:', error);
    throw error;
  }
};
