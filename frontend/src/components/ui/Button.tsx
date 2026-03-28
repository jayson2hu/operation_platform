import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 focus-visible:ring-indigo-500',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
  outline: 'border-2 border-gray-200 text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-500',
  ghost: 'text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200/50 focus-visible:ring-emerald-500',
  danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200/50 focus-visible:ring-rose-500',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
  xl: 'px-8 py-4 text-lg',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading = false, icon, className, children, disabled, ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={loading || disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-2xl font-bold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          {children}
        </>
      ) : (
        <>
          {icon && <span className="mr-2 flex items-center justify-center">{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
)

Button.displayName = 'Button'
