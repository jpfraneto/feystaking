/**
 * Loading Spinner Component
 * 
 * A cyberpunk-themed loading spinner with neon green glow effect.
 * Used throughout the app for loading states.
 */

import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Cyberpunk-themed loading spinner
 * @param size - Size variant (sm, md, lg)
 * @param className - Additional CSS classes
 */
export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={clsx('inline-block', sizeClasses[size], className)}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div className={clsx(
          'absolute inset-0 rounded-full border-2',
          'border-green-400/30 border-t-green-400',
          'animate-spin'
        )} />
        
        {/* Inner spinning ring (counter-rotation effect) */}
        <div className={clsx(
          'absolute inset-1 rounded-full border border-green-300/50',
          'border-b-green-300 animate-reverse-spin'
        )} />
        
        {/* Center glow dot */}
        <div className={clsx(
          'absolute inset-0 m-auto w-1 h-1',
          'bg-green-400 rounded-full',
          'shadow-[0_0_8px_rgba(34,197,94,0.8)]'
        )} />
      </div>
    </div>
  );
}