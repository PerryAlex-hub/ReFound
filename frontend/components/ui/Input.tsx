import { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, trailing, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-[#111827]">{label}</label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3.5 text-gray-400 pointer-events-none">{icon}</span>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-white border border-[#E5E7EB] rounded-2xl text-sm text-[#111827]
            placeholder:text-gray-400 outline-none transition-all
            focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10
            ${icon ? 'pl-10' : 'pl-4'} ${trailing ? 'pr-10' : 'pr-4'} py-3.5
            ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}
            ${className}
          `}
          {...props}
        />
        {trailing && (
          <span className="absolute right-3.5 text-gray-400">{trailing}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-[#111827]">{label}</label>
      )}
      <textarea
        ref={ref}
        className={`
          w-full bg-white border border-[#E5E7EB] rounded-2xl text-sm text-[#111827]
          placeholder:text-gray-400 outline-none transition-all resize-none
          focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10
          px-4 py-3.5
          ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}
          ${className}
        `}
        rows={props.rows ?? 4}
        {...props}
      />
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-[#111827]">{label}</label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full appearance-none bg-white border border-[#E5E7EB] rounded-2xl
            text-sm text-[#111827] outline-none transition-all
            focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10
            pl-4 pr-10 py-3.5
            ${error ? 'border-red-400' : ''}
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';
