import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'action';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-95";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg",
    secondary: "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-700 hover:bg-slate-50",
    outline: "bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    action: "bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 shadow-xl"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      <span className={`flex items-center gap-3 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
    </button>
  );
};