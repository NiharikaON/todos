export default function CalendarLoading() {
  return (
    <div className="flex h-full flex-col space-y-4 p-8">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      
      {/* Filters Skeleton */}
      <div className="flex space-x-4 mb-4">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
      </div>

      {/* Calendar Grid Skeleton */}
      <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[700px] animate-pulse">
        <div className="h-12 w-full bg-gray-100 dark:bg-gray-700 rounded mb-4"></div>
        <div className="grid grid-cols-7 gap-2 h-full">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-100 dark:border-gray-600"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
