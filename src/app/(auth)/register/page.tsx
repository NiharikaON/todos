"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { authRepository } from "@/repositories";
import { useAuth } from "@/providers/AuthProvider";
import toast from "react-hot-toast";

const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [savedPassword, setSavedPassword] = useState("");
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      await authRepository.register(data.email, data.password);
      setSavedEmail(data.email);
      setSavedPassword(data.password);
      setIsVerifying(true);
      toast.success("Account created! Please check your email for a verification code.");
    } catch (err) {
      const e = err as Error;
      setError(e.message || "An error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await authRepository.confirmSignUp(savedEmail, verificationCode);
      await authRepository.login(savedEmail, savedPassword);
      await refreshUser();
      toast.success("Account verified and logged in!");
      router.push("/dashboard");
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to verify code.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-10 shadow-2xl shadow-indigo-500/10 border border-gray-100 dark:bg-gray-800/50 dark:backdrop-blur-xl dark:border-gray-700">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Verify Your Email</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              We sent a verification code to <span className="font-medium text-indigo-600 dark:text-indigo-400">{savedEmail}</span>.
            </p>
          </div>
          <form className="mt-8 space-y-5" onSubmit={onVerify}>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 sm:text-sm dark:border-gray-700 dark:bg-gray-900/50 dark:text-white transition-all duration-200"
                placeholder="Enter 6-digit code"
                required
              />
            </div>
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading || !verificationCode}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              {isLoading ? "Verifying..." : "Verify & Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950">
      {/* Left Panel - Hero Graphic */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-600 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 via-indigo-900/20 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col h-full justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">TodoSaaS</span>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-4xl font-bold tracking-tight mb-4 leading-tight">
              Manage your tasks with effortless precision.
            </h1>
            <p className="text-indigo-100 text-lg">
              Join thousands of professionals who organize their work and life with our beautifully designed workspace.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium text-indigo-200">
            <span>Enterprise Grade</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            <span>Secure by AWS</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24 relative bg-gray-50 dark:bg-gray-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        <div className="mx-auto w-full max-w-sm lg:max-w-md relative z-10">
          <div className="lg:hidden mb-10 flex items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Enter your details below to get started with your workspace.
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  className="block w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 sm:text-sm dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:focus:bg-gray-800 transition-all duration-200"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="block w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 sm:text-sm dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:focus:bg-gray-800 transition-all duration-200"
                  placeholder="At least 8 characters"
                  {...register("password")}
                />
                {errors.password && <p className="mt-1.5 text-sm text-red-500">{errors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="block w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 sm:text-sm dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:focus:bg-gray-800 transition-all duration-200"
                  placeholder="Repeat password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && <p className="mt-1.5 text-sm text-red-500">{errors.confirmPassword.message}</p>}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-indigo-500/20 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Registering...
                  </div>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-8 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
