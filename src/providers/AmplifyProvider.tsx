"use client";

import { Amplify } from "aws-amplify";
import awsExports from "../../amplifyconfiguration.json";

try {
  Amplify.configure(awsExports);
} catch (error) {
  console.error("Failed to configure Amplify", error);
}

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
