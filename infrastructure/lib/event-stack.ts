import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

export class EventStack extends cdk.Stack {
  public readonly eventBus: events.EventBus;
  public readonly notificationsTopic: sns.Topic;
  public readonly emailQueue: sqs.Queue;
  public readonly analyticsQueue: sqs.Queue;
  public readonly auditQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.eventBus = new events.EventBus(this, 'TodoAppEventBus', {
      eventBusName: 'TodoAppEventBus',
    });

    this.notificationsTopic = new sns.Topic(this, 'NotificationsTopic', {
      displayName: 'TodoApp Notifications',
    });

    this.emailQueue = new sqs.Queue(this, 'EmailQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    this.analyticsQueue = new sqs.Queue(this, 'AnalyticsQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    this.auditQueue = new sqs.Queue(this, 'AuditQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    // Event rules for Analytics
    new events.Rule(this, 'AnalyticsRule', {
      eventBus: this.eventBus,
      eventPattern: {
        source: ['todo.api'],
      },
      targets: [new targets.SqsQueue(this.analyticsQueue)],
    });

    // Event rules for Audit
    new events.Rule(this, 'AuditRule', {
      eventBus: this.eventBus,
      eventPattern: {
        source: ['todo.api'],
        detailType: ['TodoDeleted', 'ProjectDeleted'],
      },
      targets: [new targets.SqsQueue(this.auditQueue)],
    });

    // Notifications Topic subscriber (just routing to EmailQueue for now)
    this.notificationsTopic.addSubscription(new subs.SqsSubscription(this.emailQueue));
  }
}
