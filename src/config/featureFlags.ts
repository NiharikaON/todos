// ─── Feature Flags ───────────────────────────────────────────────────────────
// Toggle between mock and AWS implementations.
// Set these in .env.local to switch providers.
// Defaults to false (mock mode) for localhost development.

export const FeatureFlags = {
  /** Use AWS Cognito for authentication instead of mock */
  USE_AWS_AUTH: process.env.NEXT_PUBLIC_USE_AWS_AUTH === "true",

  /** Use AWS AppSync/DynamoDB for data instead of mock */
  USE_AWS_DATA: process.env.NEXT_PUBLIC_USE_AWS_DATA === "true",

  /** Use AWS S3 for file storage instead of mock */
  USE_AWS_STORAGE: process.env.NEXT_PUBLIC_USE_AWS_STORAGE === "true",

  /** Use AWS EventBridge/SNS/SQS for events instead of mock */
  USE_AWS_EVENTS: process.env.NEXT_PUBLIC_USE_AWS_EVENTS === "true",
} as const;

export type FeatureFlagKey = keyof typeof FeatureFlags;
