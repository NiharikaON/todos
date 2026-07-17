// ─── API Configuration ───────────────────────────────────────────────────────

export const apiConfig = {
  appSyncUrl: process.env.NEXT_PUBLIC_APPSYNC_URL || "",
  apiGatewayUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || "",
  authenticationType: "AMAZON_COGNITO_USER_POOLS" as const,
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
} as const;
