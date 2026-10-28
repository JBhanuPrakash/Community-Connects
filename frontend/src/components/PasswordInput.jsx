import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = "",
  error,
  autoComplete = "current-password",
  required = true,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      {label && (
        <label
          htmlFor={id || name}
          className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id || name}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="input-premium w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
        />

        <button
          type="button"
          onClick={() =>
            setShowPassword((previous) => !previous)
          }
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
          aria-label={
            showPassword
              ? "Hide password"
              : "Show password"
          }
        >
          {showPassword ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs font-semibold text-red-650">
          {Array.isArray(error)
            ? error[0]
            : error}
        </p>
      )}
    </div>
  );
}

export default PasswordInput;