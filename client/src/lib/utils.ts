import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Extract initials from a name (e.g., "John Smith" => "JS")
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

// Calculate task progress percentage
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// Theme options for user dashboard customization
export const themeOptions = [
  { id: 'default', name: 'Default', bgClass: 'bg-white' },
  { id: 'blue', name: 'Blue', bgClass: 'bg-blue-50' },
  { id: 'green', name: 'Green', bgClass: 'bg-green-50' },
  { id: 'purple', name: 'Purple', bgClass: 'bg-purple-50' },
  { id: 'orange', name: 'Orange', bgClass: 'bg-orange-50' }
];

// Get theme background class
export function getThemeBgClass(theme: string): string {
  const option = themeOptions.find(t => t.id === theme);
  return option ? option.bgClass : 'bg-white';
}

// Get display format for date
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
