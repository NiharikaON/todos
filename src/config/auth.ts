// ─── Auth Configuration ──────────────────────────────────────────────────────

export const authConfig = {
  userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
  userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "",
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
} as const;
