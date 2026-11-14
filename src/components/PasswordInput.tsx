import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className = '', disabled, ...inputProps }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative w-full">
        <input
          {...inputProps}
          ref={ref}
          type={visible ? 'text' : 'password'}
          disabled={disabled}
          className={className}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          title={visible ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#5C6982] transition hover:bg-[#F3F6FC] hover:text-[#004BEC] focus:outline-none focus:ring-2 focus:ring-[#6121D0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
