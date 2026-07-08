import { LucideIcon, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {cn} from "@coreModule/components/lib/utils.ts";

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  compact?: boolean;
  /** When set, the card navigates to the underlying list/detail. */
  href?: string;
  /** Accessible label for the drill-down control (e.g. "View entries"). */
  linkLabel?: string;
}

const variantStyles = {
  default: 'border-border',
  primary: 'border-primary/30 bg-primary/5',
  success: 'border-status-sold/30 bg-status-sold/5',
  warning: 'border-status-reserved/30 bg-status-reserved/5',
  danger: 'border-status-blocked/30 bg-status-blocked/5',
};

const iconVariantStyles = {
  default: 'bg-accent text-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-status-sold/20 text-status-sold',
  warning: 'bg-status-reserved/20 text-status-reserved',
  danger: 'bg-status-blocked/20 text-status-blocked',
};

function DrillDownIndicator({ linkLabel }: { linkLabel?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5',
        'text-muted-foreground text-[10px] font-medium',
      )}
      aria-hidden
    >
      {linkLabel != null && linkLabel !== '' ? (
        <span className="hidden sm:inline max-w-[5rem] truncate">{linkLabel}</span>
      ) : null}
      <ChevronRight size={14} className="shrink-0" />
    </span>
  );
}

function KpiCardShell({
  href,
  linkLabel,
  title,
  variant,
  compact,
  children,
}: {
  href?: string;
  linkLabel?: string;
  title: string;
  variant: KPICardProps['variant'];
  compact?: boolean;
  children: ReactNode;
}) {
  const interactive = href != null && href !== '';
  const shellClass = cn(
    'kpi-card',
    variantStyles[variant ?? 'default'],
    interactive && 'cursor-pointer transition-shadow hover:shadow-sm hover:ring-1 hover:ring-border/80',
    compact && 'gap-0 rounded-lg p-3',
  );

  if (interactive) {
    return (
      <Link
        to={href}
        className={cn(shellClass, 'block no-underline text-inherit')}
        aria-label={linkLabel ? `${linkLabel}: ${title}` : title}
      >
        {children}
      </Link>
    );
  }

  return <div className={shellClass}>{children}</div>;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  compact = false,
  href,
  linkLabel,
}: KPICardProps) {

  if (compact) {
    return (
      <KpiCardShell href={href} linkLabel={linkLabel} title={title} variant={variant} compact>
        <div className="flex items-center gap-1.5 mb-1">
          <div className={cn('shrink-0 p-1.5 rounded-md', iconVariantStyles[variant])}>
            <Icon size={16} />
          </div>
          <p className="text-muted-foreground font-medium leading-tight truncate min-w-0 flex-1">
            {title}
          </p>
          <p className="font-display font-bold text-foreground text-lg leading-tight tracking-tight">
            {value}
          </p>
          {trend != null && (
            <span
              className={cn(
                'shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-md',
                trend.isPositive
                  ? 'bg-status-sold/10 text-status-sold'
                  : 'bg-status-blocked/10 text-status-blocked',
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
          )}
          {href != null && href !== '' && <DrillDownIndicator linkLabel={linkLabel} />}
        </div>
        {subtitle != null && (
          <p className="text-muted-foreground text-xs leading-tight mt-2">
            {subtitle}
          </p>
        )}
      </KpiCardShell>
    );
  }

  return (
    <KpiCardShell href={href} linkLabel={linkLabel} title={title} variant={variant}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className={cn('p-3 rounded-xl', iconVariantStyles[variant])}>
          <Icon size={24} />
        </div>
        <div className="flex items-center gap-2">
          {trend != null && (
            <span
              className={cn(
                'shrink-0 text-sm font-medium px-2 py-1 rounded-full',
                trend.isPositive
                  ? 'bg-status-sold/10 text-status-sold'
                  : 'bg-status-blocked/10 text-status-blocked',
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
          )}
          {href != null && href !== '' && <DrillDownIndicator linkLabel={linkLabel} />}
        </div>
      </div>

      <p className="text-muted-foreground font-medium text-sm leading-tight mb-1">
        {title}
      </p>
      <p className="font-display font-bold text-3xl text-foreground leading-tight">
        {value}
      </p>
      {subtitle != null && (
        <p className="text-muted-foreground text-sm leading-tight mt-1">
          {subtitle}
        </p>
      )}
    </KpiCardShell>
  );
}
