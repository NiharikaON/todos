"use client";

import { useState } from "react";
import { resetPassword, confirmResetPassword } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"REQUEST" | "CONFIRM">("REQUEST");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const output = await resetPassword({ username: email });
      if (output.nextStep.resetPasswordStep === "CONFIRM_RESET_PASSWORD_WITH_CODE") {
        setStep("CONFIRM");
      }
    } catch (err) {
      const e = err as Error;
      setError(e.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
      router.push("/login?reset=success");
    } catch (err) {
      const e = err as Error;
      setError(e.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg dark:bg-gray-800">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Reset Password
        </h2>
        
        {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {step === "REQUEST" ? (
          <form className="mt-8 space-y-6" onSubmit={handleRequest}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Email address"
            />
            <button type="submit" disabled={isLoading} className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
              {isLoading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleConfirm}>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Verification Code"
            />
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="New Password"
            />
            <button type="submit" disabled={isLoading} className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
              {isLoading ? "Resetting..." : "Confirm New Password"}
            </button>
          </form>
        )}
        <div className="text-center text-sm">
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
