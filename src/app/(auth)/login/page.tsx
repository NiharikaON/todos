"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { authRepository } from "@/repositories";
import toast from "react-hot-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [savedPassword, setSavedPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      await authRepository.login(data.email, data.password);
      await refreshUser();
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err) {
      const e = err as Error;
      if (e.message === "CONFIRM_SIGN_UP_REQUIRED" || e.message.includes("UserNotConfirmedException")) {
        setSavedEmail(data.email);
        setSavedPassword(data.password);
        setIsVerifying(true);
        toast.success("Please verify your email address to continue.");
      } else {
        setError(e.message || "An error occurred during login.");
      }
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
            <button
              type="button"
              onClick={() => setIsVerifying(false)}
              className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950">
      {/* Left Panel - Hero Graphic */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-600 overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        
        <div className="relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 ring-1 ring-white/20 transition-transform hover:scale-[1.02] duration-500">
          <img src="/dashboard-illustration.png" alt="Dashboard Illustration" className="w-full h-auto object-cover" />
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24 relative bg-gray-50 dark:bg-gray-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        <div className="mx-auto w-full max-w-sm lg:max-w-md relative z-10">

          <div className="bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-700">
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Please enter your details to sign in to your workspace.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="block w-full pl-10 rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-500/10 sm:text-sm dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:focus:bg-gray-800 transition-all duration-200"
                    placeholder="you@example.com"
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="block w-full pl-10 rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-500/10 sm:text-sm dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:focus:bg-gray-800 transition-all duration-200"
                    placeholder="••••••••"
                    {...register("password")}
                  />
                </div>
                {errors.password && <p className="mt-1.5 text-sm text-red-500">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Remember me
                  </label>
                </div>
                <Link href="/forgot-password" className="text-sm font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 transition-colors">
                  Forgot password?
                </Link>
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
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>


            <p className="text-center text-sm text-gray-500 mt-8 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
