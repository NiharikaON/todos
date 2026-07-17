// ─── AWS Configuration ───────────────────────────────────────────────────────

export const awsConfig = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
} as const;
