"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { confirmSignUp } from "aws-amplify/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

const verifySchema = z.object({
  code: z.string().min(6, { message: "Code must be at least 6 characters" }),
});

type VerifyFormValues = z.infer<typeof verifySchema>;

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit = async (data: VerifyFormValues) => {
    if (!email) {
      setError("Email is missing. Please try signing up again.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode: data.code,
      });

      if (isSignUpComplete) {
        router.push("/login?verified=true");
      }
    } catch (err: unknown) {
      const e = err as Error;
      console.error(e);
      setError(e.message || "An error occurred during verification.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg dark:bg-gray-800">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            We sent a code to <span className="font-semibold">{email}</span>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="code" className="sr-only">Verification Code</label>
              <input
                id="code"
                type="text"
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Enter 6-digit code"
                {...register("code")}
              />
              {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Verifying..." : "Verify Account"}
            </button>
          </div>
          <div className="text-center text-sm">
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Back to Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyForm />
    </Suspense>
  );
}
