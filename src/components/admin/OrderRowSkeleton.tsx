import React from 'react';

export const OrderRowSkeleton = () => {
  return (
    <div className="p-4 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-4">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-cream-200 rounded"></div>
          <div className="h-4 w-40 bg-cream-200 rounded"></div>
          <div className="h-3 w-48 bg-cream-200 rounded"></div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right space-y-2">
          <div className="h-6 w-24 bg-cream-200 rounded"></div>
          <div className="h-3 w-20 bg-cream-200 rounded ml-auto"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 bg-cream-200 rounded-lg"></div>
          <div className="h-8 w-16 bg-cream-200 rounded-lg"></div>
        </div>
        <div className="w-48">
          <div className="h-10 bg-cream-200 rounded-lg"></div>
        </div>
        <div className="h-10 w-10 bg-cream-200 rounded-lg"></div>
      </div>
    </div>
  );
};
