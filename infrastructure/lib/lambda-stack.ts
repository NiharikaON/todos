import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as path from 'path';

export interface LambdaStackProps extends cdk.StackProps {
  tasksTable: dynamodb.Table;
  projectsTable: dynamodb.Table;
  notificationsTable: dynamodb.Table;
  eventBus: events.EventBus;
  notificationsTopic: sns.Topic;
}

export class LambdaStack extends cdk.Stack {
  public readonly apiHandler: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    this.apiHandler = new lambdaNodejs.NodejsFunction(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../src/lambda/api-handler/index.ts'),
      handler: 'handler',
      environment: {
        TODOS_TABLE: props.tasksTable.tableName,
        PROJECTS_TABLE: props.projectsTable.tableName,
        NOTIFICATIONS_TABLE: props.notificationsTable.tableName,
        EVENT_BUS_NAME: props.eventBus.eventBusName,
      },
      bundling: {
        externalModules: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb', '@aws-sdk/client-eventbridge'],
      }
    });

    // Grant permissions
    props.tasksTable.grantReadWriteData(this.apiHandler);
    props.projectsTable.grantReadWriteData(this.apiHandler);
    props.notificationsTable.grantReadWriteData(this.apiHandler);
    props.eventBus.grantPutEventsTo(this.apiHandler);

    const notificationProcessor = new lambdaNodejs.NodejsFunction(this, 'NotificationProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../src/lambda/notification-processor/index.ts'),
      handler: 'handler',
      environment: {
        NOTIFICATIONS_TABLE: props.notificationsTable.tableName,
        SNS_TOPIC_ARN: props.notificationsTopic.topicArn,
      },
      bundling: {
        externalModules: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb', '@aws-sdk/client-sns'],
      }
    });

    props.notificationsTable.grantWriteData(notificationProcessor);
    props.notificationsTopic.grantPublish(notificationProcessor);

    new events.Rule(this, 'NotificationRule', {
      eventBus: props.eventBus,
      eventPattern: {
        source: ['todo.api', 'todo.cron'],
        detailType: ['TodoCreated', 'TodoOverdue', 'ProjectCreated', 'TodoDueSoon'],
      },
      targets: [new targets.LambdaFunction(notificationProcessor)],
    });

    const reminderCron = new lambdaNodejs.NodejsFunction(this, 'ReminderCron', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../src/lambda/reminder-cron/index.ts'),
      handler: 'handler',
      environment: {
        TODOS_TABLE: props.tasksTable.tableName,
        EVENT_BUS_NAME: props.eventBus.eventBusName,
      },
      bundling: {
        externalModules: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb', '@aws-sdk/client-eventbridge'],
      }
    });

    props.tasksTable.grantReadData(reminderCron);
    props.eventBus.grantPutEventsTo(reminderCron);

    new events.Rule(this, 'ReminderCronRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)), // Runs every 5 minutes for precise reminders
      targets: [new targets.LambdaFunction(reminderCron)],
    });
  }
}
