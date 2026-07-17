import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly authenticatedRole: iam.Role;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, 'TodoAppPool', {
      userPoolName: 'TodoAppPool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev/testing
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'TodoAppClient', {
      userPool: this.userPool,
      userPoolClientName: 'TodoAppClient',
      generateSecret: false,
    });

    // Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, 'TodoAppIdentityPool', {
      identityPoolName: 'TodoAppIdentityPool',
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: this.userPoolClient.userPoolClientId,
        providerName: this.userPool.userPoolProviderName,
      }],
    });

    // Authenticated Role
    this.authenticatedRole = new iam.Role(this, 'CognitoAuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
        StringEquals: { 'cognito-identity.amazonaws.com:aud': identityPool.ref },
        'ForAnyValue:StringLike': { 'cognito-identity.amazonaws.com:amr': 'authenticated' },
      }, 'sts:AssumeRoleWithWebIdentity'),
    });

    // Attach Role to Identity Pool
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: this.authenticatedRole.roleArn,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'The ID of the User Pool',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'The ID of the User Pool Client',
    });

    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: identityPool.ref,
      description: 'The ID of the Identity Pool',
    });
  }
}
