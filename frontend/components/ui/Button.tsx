import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, children, className = '', disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-opacity rounded-full disabled:opacity-50 disabled:cursor-not-allowed';
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-sm',
      lg: 'px-6 py-4 text-base',
    };
    const variants = {
      primary: 'bg-[#F97316] text-white hover:opacity-90 active:opacity-80',
      secondary: 'bg-gray-100 text-gray-800 hover:opacity-90',
      outline: 'border border-[#F97316] text-[#F97316] hover:opacity-90 bg-transparent',
      ghost: 'text-gray-600 hover:bg-gray-100',
      danger: 'bg-red-500 text-white hover:opacity-90',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {loading && <Spinner size="sm" color={variant === 'primary' || variant === 'danger' ? 'white' : 'orange'} />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
