#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { DatabaseStack } from '../lib/database-stack';
import { StorageStack } from '../lib/storage-stack';
import { ApiStack } from '../lib/api-stack';
import { EventStack } from '../lib/event-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

const authStack = new AuthStack(app, 'TodoAppAuthStack', { env });

const dbStack = new DatabaseStack(app, 'TodoAppDatabaseStack', { env });

const storageStack = new StorageStack(app, 'TodoAppStorageStack', { 
  env, 
  authenticatedRole: authStack.authenticatedRole 
});

const eventStack = new EventStack(app, 'TodoAppEventStack', { env });

const lambdaStack = new LambdaStack(app, 'TodoAppLambdaStack', {
  env,
  tasksTable: dbStack.tasksTable,
  projectsTable: dbStack.projectsTable,
  notificationsTable: dbStack.notificationsTable,
  eventBus: eventStack.eventBus,
  notificationsTopic: eventStack.notificationsTopic,
});
lambdaStack.addDependency(dbStack);
lambdaStack.addDependency(eventStack);

const apiStack = new ApiStack(app, 'TodoAppApiStack', {
  env,
  userPool: authStack.userPool,
  apiHandler: lambdaStack.apiHandler,
});
apiStack.addDependency(authStack);
apiStack.addDependency(lambdaStack);

const monitoringStack = new MonitoringStack(app, 'TodoAppMonitoringStack', {
  env,
  apiHandler: lambdaStack.apiHandler,
  graphqlApi: apiStack.graphqlApi,
});
monitoringStack.addDependency(lambdaStack);
monitoringStack.addDependency(apiStack);
