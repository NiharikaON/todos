import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  apiHandler: lambdaNodejs.NodejsFunction;
}

export class ApiStack extends cdk.Stack {
  public readonly graphqlApi: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    this.graphqlApi = new appsync.GraphqlApi(this, 'TodoAppApi', {
      name: 'TodoAppApi',
      definition: appsync.Definition.fromSchema(appsync.SchemaFile.fromAsset(path.join(__dirname, '../schema.graphql'))),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: props.userPool,
          },
        },
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    });

    const lambdaDataSource = this.graphqlApi.addLambdaDataSource('LambdaDataSource', props.apiHandler);

    // Queries
    const queries = ['getTodo', 'listTodos', 'searchTodos', 'getProject', 'listProjects', 'getNotifications'];
    queries.forEach(query => {
      lambdaDataSource.createResolver(`Resolver${query}`, {
        typeName: 'Query',
        fieldName: query,
      });
    });

    // Mutations
    const mutations = [
      'createTodo', 'updateTodo', 'deleteTodo',
      'createProject', 'updateProject', 'deleteProject',
      'markNotificationRead', 'markNotificationUnread', 'markAllNotificationsRead'
    ];
    mutations.forEach(mutation => {
      lambdaDataSource.createResolver(`Resolver${mutation}`, {
        typeName: 'Mutation',
        fieldName: mutation,
      });
    });

    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: this.graphqlApi.graphqlUrl,
      description: 'The URL for the AppSync GraphQL API',
    });
  }
}
