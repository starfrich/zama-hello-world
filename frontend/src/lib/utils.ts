/**
 * @fileoverview Utility functions for UI styling and class management
 *
 * This module provides utility functions commonly used throughout the application,
 * particularly for managing CSS classes with Tailwind CSS and conditional styling.
 *
 * @author Starfish
 * @version 1.0.0
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges CSS class names intelligently.
 *
 * This utility function combines multiple class values using clsx for conditional
 * classes and then merges them with Tailwind CSS classes using tailwind-merge
 * to avoid conflicts and ensure optimal class precedence.
 *
 * @param inputs - Variable number of class values (strings, objects, arrays)
 *
 * @returns Merged and optimized class string
 *
 * @example
 * ```typescript
 * // Basic usage
 * cn('px-2 py-1', 'bg-blue-500') // 'px-2 py-1 bg-blue-500'
 *
 * // Conditional classes
 * cn(
 *   'base-class',
 *   {
 *     'text-red-500': hasError,
 *     'text-green-500': isSuccess
 *   }
 * )
 *
 * // Overriding Tailwind classes
 * cn('px-2 py-1', 'px-4') // 'py-1 px-4' (px-4 overrides px-2)
 *
 * // In React components
 * <div className={cn(
 *   'rounded-lg border',
 *   variant === 'primary' && 'bg-blue-500 text-white',
 *   variant === 'secondary' && 'bg-gray-200 text-gray-800',
 *   className // Allow prop override
 * )}>
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
