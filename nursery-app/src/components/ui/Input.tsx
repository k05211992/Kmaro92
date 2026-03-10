import { cn } from "@/lib/utils";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export function Input({
  label,
  error,
  leftAddon,
  rightAddon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftAddon && (
          <span className="absolute left-3 text-gray-400 text-sm">{leftAddon}</span>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900",
            "px-3 py-2 placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
            "disabled:opacity-50 disabled:bg-gray-50",
            error && "border-red-400 focus:ring-red-400",
            leftAddon && "pl-8",
            rightAddon && "pr-8",
            className
          )}
          {...props}
        />
        {rightAddon && (
          <span className="absolute right-3 text-gray-400 text-sm">{rightAddon}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900",
          "px-3 py-2 placeholder:text-gray-400 resize-none",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
          "disabled:opacity-50 disabled:bg-gray-50",
          error && "border-red-400 focus:ring-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
