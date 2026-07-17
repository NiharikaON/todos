import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as appsync from 'aws-cdk-lib/aws-appsync';

export interface MonitoringStackProps extends cdk.StackProps {
  apiHandler: lambdaNodejs.NodejsFunction;
  graphqlApi: appsync.GraphqlApi;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const dashboard = new cloudwatch.Dashboard(this, 'TodoAppDashboard', {
      dashboardName: 'TodoApp-Production-Dashboard',
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ApiHandler Errors',
        left: [props.apiHandler.metricErrors()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'ApiHandler Invocations',
        left: [props.apiHandler.metricInvocations()],
        width: 12,
      })
    );

    // Alarms
    new cloudwatch.Alarm(this, 'ApiHandlerErrorsAlarm', {
      metric: props.apiHandler.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm if ApiHandler Lambda errors exceed 5',
    });
  }
}
