'use client';

import { cn } from '@/lib/utils';
import { ViolationType } from '@/types';
import { AlertTriangle, Shield, Key, Heart, Brain, HelpCircle } from 'lucide-react';

interface ViolationBadgeProps {
  type: ViolationType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const violationConfig: Record<ViolationType, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof AlertTriangle;
}> = {
  escape_control: {
    label: 'Escape Control',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: AlertTriangle,
  },
  fraud: {
    label: 'Fraud',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: AlertTriangle,
  },
  security_breach: {
    label: 'Security Breach',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: Key,
  },
  human_harm: {
    label: 'Human Harm',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-200 dark:bg-red-900/40',
    icon: Heart,
  },
  manipulation: {
    label: 'Manipulation',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: Brain,
  },
  other: {
    label: 'Other',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: HelpCircle,
  },
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5 gap-1',
  md: 'text-sm px-2 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function ViolationBadge({ type, size = 'md', showLabel = true }: ViolationBadgeProps) {
  const config = violationConfig[type];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.bgColor,
        config.color,
        sizeClasses[size]
      )}
    >
      <Icon size={iconSizes[size]} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
