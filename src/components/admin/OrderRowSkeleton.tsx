import React from 'react';

export const OrderRowSkeleton = () => {
  return (
    <div className="p-6 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-6">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-200 rounded"></div>
          <div className="h-5 w-40 bg-slate-200 rounded"></div>
          <div className="h-3 w-48 bg-slate-200 rounded"></div>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="text-right space-y-2">
          <div className="h-8 w-24 bg-slate-200 rounded"></div>
          <div className="h-3 w-20 bg-slate-200 rounded ml-auto"></div>
        </div>
        <div className="flex items-center gap-2">
            <div className="h-8 w-16 bg-slate-200 rounded-lg"></div>
            <div className="h-8 w-16 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="w-48">
          <div className="h-12 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-11 w-11 bg-slate-200 rounded-[20px]">
        </div>
      </div>
    </div>
  );
};
