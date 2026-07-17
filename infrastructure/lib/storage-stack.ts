import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface StorageStackProps extends cdk.StackProps {
  authenticatedRole: iam.IRole;
}

export class StorageStack extends cdk.Stack {
  public readonly storageBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    this.storageBucket = new s3.Bucket(this, 'TodoAppStorage', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          exposedHeaders: ['ETag'],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev/testing
      autoDeleteObjects: true, // For dev/testing
    });

    props.authenticatedRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
      resources: [
        `${this.storageBucket.bucketArn}/public/*`,
        `${this.storageBucket.bucketArn}/protected/*`,
        `${this.storageBucket.bucketArn}/private/*`,
      ],
    }));

    // Output
    new cdk.CfnOutput(this, 'StorageBucketName', {
      value: this.storageBucket.bucketName,
      description: 'The name of the S3 Storage Bucket',
    });
  }
}
