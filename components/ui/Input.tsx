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
            w-full py-3 px-4 bg-gray-50 dark:bg-dark-800 border border-transparent 
            rounded-xl text-sm dark:text-white outline-none transition-all
            focus:bg-white dark:focus:bg-dark-700 focus:border-brown-900 dark:focus:border-gold
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-[10px] text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  );
};