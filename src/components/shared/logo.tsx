'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
}

export function Logo({ className, size = 'md', withText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-7 h-7', text: 'text-lg' },
    md: { icon: 'w-9 h-9', text: 'text-xl' },
    lg: { icon: 'w-12 h-12', text: 'text-3xl' },
  };

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className={cn('relative', sizes[size].icon)}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="tt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(250, 84%, 54%)" />
              <stop offset="100%" stopColor="hsl(280, 70%, 50%)" />
            </linearGradient>
            <filter id="tt-shadow">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="hsl(250, 84%, 54%)" floodOpacity="0.25" />
            </filter>
          </defs>
          {/* Background rounded square */}
          <rect x="1" y="1" width="38" height="38" rx="10" fill="url(#tt-grad)" filter="url(#tt-shadow)" />
          {/* Inner highlight */}
          <rect x="2" y="2" width="36" height="18" rx="9" fill="white" fillOpacity="0.15" />
          {/* TT letters - bold geometric */}
          <path
            d="M8 12h10M13 12v16M22 12h10M27 12v16"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {withText && (
        <span className={cn('font-extrabold tracking-tight', sizes[size].text)}>
          Tasker<span className="gradient-text">Time</span>
        </span>
      )}
    </div>
  );
}
