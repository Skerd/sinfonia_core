import { LucideIcon, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from "@coreModule/components/lib/utils.ts";
import { Badge } from "@coreModule/components/ui/badge.tsx";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@coreModule/components/ui/card.tsx";

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

/** Overrides `Card`'s neutral `ring-foreground/10` with the variant accent. */
const variantStyles: Record<NonNullable<KPICardProps['variant']>, string> = {
  default: '',
  primary: 'ring-primary/30 bg-primary/5',
  success: 'ring-status-sold/30 bg-status-sold/5',
  warning: 'ring-status-reserved/30 bg-status-reserved/5',
  danger: 'ring-status-blocked/30 bg-status-blocked/5',
};

const iconVariantStyles: Record<NonNullable<KPICardProps['variant']>, string> = {
  default: 'bg-accent text-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-status-sold/20 text-status-sold',
  warning: 'bg-status-reserved/20 text-status-reserved',
  danger: 'bg-status-blocked/20 text-status-blocked',
};

function TrendBadge({ trend }: { trend: NonNullable<KPICardProps['trend']> }) {
  return (
    <Badge
      variant={trend.isPositive ? 'secondary' : 'destructive'}
      className={cn('shrink-0', trend.isPositive && 'bg-success/10 text-success')}
    >
      {trend.isPositive ? '+' : ''}
      {trend.value}%
    </Badge>
  );
}

function DrillDownIndicator({ linkLabel }: { linkLabel?: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-muted-foreground"
      aria-hidden
    >
      {linkLabel != null && linkLabel !== '' ? (
        <span className="hidden max-w-[5rem] truncate sm:inline">{linkLabel}</span>
      ) : null}
      <ChevronRight size={14} className="shrink-0" />
    </span>
  );
}

/**
 * Stretched overlay instead of wrapping the card in an anchor: keeps `Card` as the
 * layout root (so the `data-size` group selectors still drive header/content padding)
 * while still giving one focusable, keyboard-reachable link per card.
 */
function DrillDownOverlayLink({
  href,
  title,
  linkLabel,
}: {
  href: string;
  title: string;
  linkLabel?: string;
}) {
  return (
    <Link
      to={href}
      className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="sr-only">{linkLabel ? `${linkLabel}: ${title}` : title}</span>
    </Link>
  );
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
  const interactive = href != null && href !== '';
  const shellClass = cn(
    'relative',
    variantStyles[variant],
    interactive && 'transition-shadow hover:ring-2 hover:ring-primary/30',
  );

  if (compact) {
    return (
      <Card size="sm" className={cn(shellClass, 'gap-2')}>
        {interactive && <DrillDownOverlayLink href={href} title={title} linkLabel={linkLabel} />}
        {/* Flex row rather than the header's default grid: icon, label and value share one line. */}
        <CardHeader className="flex items-center gap-1.5">
          <div className={cn('shrink-0 rounded-md p-1.5', iconVariantStyles[variant])}>
            <Icon size={16} />
          </div>
          <CardTitle className="min-w-0 flex-1 truncate font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <CardAction className="flex items-center gap-1.5 self-center">
            <span className="font-display text-lg leading-tight font-bold tracking-tight text-foreground">
              {value}
            </span>
            {trend != null && <TrendBadge trend={trend} />}
            {interactive && <DrillDownIndicator linkLabel={linkLabel} />}
          </CardAction>
        </CardHeader>
        {subtitle != null && (
          <CardContent className="text-xs leading-tight text-muted-foreground">
            {subtitle}
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className={cn(shellClass, 'py-6')}>
      {interactive && <DrillDownOverlayLink href={href} title={title} linkLabel={linkLabel} />}
      <CardHeader className="px-6">
        <div className={cn('w-fit rounded-xl p-3', iconVariantStyles[variant])}>
          <Icon size={24} />
        </div>
        {(trend != null || interactive) && (
          <CardAction className="flex items-center gap-2">
            {trend != null && <TrendBadge trend={trend} />}
            {interactive && <DrillDownIndicator linkLabel={linkLabel} />}
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="px-6">
        <p className="text-sm leading-tight font-medium text-muted-foreground">{title}</p>
        <p className="font-display text-3xl leading-tight font-bold text-foreground">{value}</p>
        {subtitle != null && (
          <p className="mt-1 text-sm leading-tight text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
