"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Something went wrong!
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        We encountered an error while trying to load the Calendar module. Please try again or contact support if the issue persists.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
