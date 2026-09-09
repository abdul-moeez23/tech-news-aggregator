import React from 'react';

function SkeletonCard({ gridSpan = "col-span-1 row-span-1" }) {
  return (
    <div className={`bg-bg-card border border-border-subtle rounded-2xl overflow-hidden flex flex-col min-h-[220px] animate-pulse ${gridSpan}`}>
      <div className="p-6 flex flex-col h-full relative">
        {/* Source Icon Skeleton */}
        <div className="w-6 h-6 rounded-md bg-border-subtle mb-4"></div>
        
        {/* Title Skeleton */}
        <div className="mt-2 mb-4">
          <div className="h-5 bg-border-subtle rounded w-3/4 mb-2"></div>
          <div className="h-5 bg-border-subtle rounded w-full mb-2"></div>
          <div className="h-5 bg-border-subtle rounded w-5/6"></div>
        </div>
        
        {/* Summary Skeleton */}
        <div className="mb-6 space-y-2 mt-2">
          <div className="h-3 bg-border-subtle rounded w-full"></div>
          <div className="h-3 bg-border-subtle rounded w-5/6"></div>
          <div className="h-3 bg-border-subtle rounded w-4/6"></div>
        </div>
        
        {/* Footer Skeleton */}
        <div className="flex items-center gap-2 mt-auto">
          <div className="h-6 w-16 bg-border-subtle rounded"></div>
          <div className="h-3 w-32 bg-border-subtle rounded ml-2"></div>
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
