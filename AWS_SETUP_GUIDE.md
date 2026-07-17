# AWS Infrastructure as Code (CDK) Guide

We have migrated from a manual AWS Console setup to an automated **Infrastructure as Code** deployment using the AWS Cloud Development Kit (CDK).

All of the necessary infrastructure—including Cognito User Pools, DynamoDB Tables, S3 Buckets, and the AppSync GraphQL API—is defined in the `infrastructure/` directory.

## Prerequisites

1. Install the [AWS CLI](https://aws.amazon.com/cli/).
2. Run `aws configure` in your terminal and enter your AWS Access Key, Secret Key, and default region (e.g., `us-east-1`).
3. Make sure you have Node.js installed.

## Deployment Steps

1. **Navigate to the infrastructure directory:**
   ```bash
   cd infrastructure
   ```

2. **Bootstrap your AWS environment:**
   *(You only need to do this once per AWS account/region)*
   ```bash
   npx cdk bootstrap
   ```

3. **Deploy the Stacks:**
   ```bash
   npx cdk deploy --all
   ```
   *Type `y` when prompted to confirm IAM security changes for each stack.*

## Connect Your Application

Once the deployment finishes, the terminal will print out several **Outputs**. You will use these outputs to connect your frontend.

Open `amplifyconfiguration.json` in the root of your project and update the values:

```json
{
  "aws_project_region": "us-east-1",
  "aws_cognito_region": "us-east-1",
  "aws_user_pools_id": "<TodoAppAuthStack.UserPoolId>",
  "aws_user_pools_web_client_id": "<TodoAppAuthStack.UserPoolClientId>",
  "aws_cognito_identity_pool_id": "<TodoAppAuthStack.IdentityPoolId>",
  "aws_appsync_graphqlEndpoint": "<TodoAppApiStack.GraphQLAPIURL>",
  "aws_appsync_region": "us-east-1",
  "aws_appsync_authenticationType": "AMAZON_COGNITO_USER_POOLS",
  "aws_user_files_s3_bucket": "<TodoAppStorageStack.StorageBucketName>",
  "aws_user_files_s3_bucket_region": "us-east-1"
}
```

## Enable AWS Integration

Finally, open `src/config/featureFlags.ts` and set your flags to `true`:

```typescript
export const FeatureFlags = {
  USE_AWS_AUTH: true,
  USE_AWS_DATA: true,
  USE_AWS_STORAGE: true,
  USE_AWS_EVENTS: true,
};
```

Restart your Next.js server (`npm run dev`) and you are live!
