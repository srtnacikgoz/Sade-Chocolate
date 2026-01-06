import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, icon, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1 tracking-widest">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-lg">
            {icon}
          </span>
        )}
        <input
          className={`
            w-full h-16 px-4 bg-white dark:bg-dark-800 border
            rounded-md text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            outline-none transition-all
            ${icon ? 'pl-10' : ''}
            ${error
              ? 'border-red-500 border-2 bg-red-50 dark:bg-red-900/10 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-500/20'
              : 'border-gray-400 dark:border-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30'
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-[10px] text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  );
};