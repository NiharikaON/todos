import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class DatabaseStack extends cdk.Stack {
  public readonly tasksTable: dynamodb.Table;
  public readonly projectsTable: dynamodb.Table;
  public readonly notificationsTable: dynamodb.Table;
  public readonly auditLogsTable: dynamodb.Table;
  public readonly analyticsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.tasksTable = new dynamodb.Table(this, 'Todos', {
      tableName: 'Todos',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // We can add GSIs to Tasks for efficient querying
    this.tasksTable.addGlobalSecondaryIndex({
      indexName: 'byUserId',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    this.projectsTable = new dynamodb.Table(this, 'Projects', {
      tableName: 'Projects',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.projectsTable.addGlobalSecondaryIndex({
      indexName: 'byOwnerId',
      partitionKey: { name: 'ownerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    this.notificationsTable = new dynamodb.Table(this, 'Notifications', {
      tableName: 'Notifications',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.notificationsTable.addGlobalSecondaryIndex({
      indexName: 'byUserId',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    this.auditLogsTable = new dynamodb.Table(this, 'AuditLogs', {
      tableName: 'AuditLogs',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.analyticsTable = new dynamodb.Table(this, 'Analytics', {
      tableName: 'Analytics',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
