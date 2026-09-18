import type {ComponentType} from "react";
import {IconLoader} from "@tabler/icons-react";
import {cn} from "@coreModule/components/lib/utils.ts";
import TruncatedValue from "@coreModule/components/custom/displayValue/truncatedValue.tsx";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";

type SpinnerIconProps = {
    className?: string;
};

/**
 * The one spinner glyph in the app. Not exported -- every loading indicator goes
 * through {@link Loader} (`inline` for a bare icon, the default for the boxed
 * variant), so there is exactly one place that owns what "loading" looks like.
 */
function SpinnerIcon({className}: SpinnerIconProps) {
    return <IconLoader data-slot="spinner" aria-hidden className={cn("size-4 animate-spin", className)} />;
}

type LoaderProps = WithLanguageType & {
    className?: string;
    /** Rendered as a Tailwind size, so it tracks the type scale rather than a pixel value. */
    size?: number | string;
    /** Override the spinner glyph. Must accept a className. */
    Icon?: ComponentType<SpinnerIconProps>;
    title?: string;
    iconClassName?: string;
    /** Defaults to currentColor so the spinner follows whatever text color it sits in. */
    color?: string;
    /**
     * Bare icon (optionally with a title alongside it) instead of the bordered,
     * full-width box -- for a loading state sitting inline among other content
     * (a button, a compact list row) rather than occupying its own section.
     */
    inline?: boolean;
    /** Injected by `withLanguage` alongside the rest of {@link WithLanguageType}; not a public prop. */
    withLanguage?: unknown;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children">;

/** Legacy callers pass pixel sizes (`"20px"`, `24`); map those onto the icon box. */
function resolveSizeStyle(size: number | string | undefined) {
    if (size == null) return undefined;
    const value = typeof size === "number" ? `${size}px` : size;
    return {width: value, height: value};
}

function Loader({
    className,
    size = "20px",
    Icon = SpinnerIcon,
    iconClassName = "",
    title,
    color = "currentColor",
    inline = false,
    resolveLanguageKey,
    // Injected by `withLanguage` too, but unused here -- pulled out by name so they
    // don't end up in `...rest` and get spread onto the DOM node below.
    currentLanguage: _currentLanguage,
    languageCode: _languageCode,
    resolveLanguageValue: _resolveLanguageValue,
    withLanguage: _withLanguageMeta,
    ...rest
}: LoaderProps) {
    const ariaLabel = title ?? resolveLanguageKey("loading");

    if (inline) {
        // `className` (caller's sizing/margin/shrink/color) always lands on the element
        // that is actually the flex item in the caller's layout -- with no title, that's
        // this one span; with a title, it's the icon's own inner span instead (below),
        // and a size/shrink utility on a non-flex-item descendant would silently do nothing.
        const iconBoxClassName = cn("inline-flex shrink-0 size-4 animate-spin items-center justify-center", className);
        const icon = <Icon className={cn("size-full", iconClassName)} />;

        if (!title) {
            return (
                <span role="status" aria-label={ariaLabel} className={iconBoxClassName} {...rest}>
                    {icon}
                </span>
            );
        }
        return (
            <span role="status" aria-label={ariaLabel} className="inline-flex items-center gap-1.5" {...rest}>
                <span className={iconBoxClassName}>{icon}</span>
                <TruncatedValue as="span" className="animate-pulse text-xs font-bold text-muted-foreground">
                    {title}
                </TruncatedValue>
            </span>
        );
    }

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={ariaLabel}
            className={cn("flex w-full items-center justify-center gap-2 rounded-lg border border-border p-2 text-muted-foreground", className)}
            {...rest}
        >
            <span className="inline-flex shrink-0 items-center justify-center" style={{...resolveSizeStyle(size), color}}>
                <Icon className={cn("size-full", iconClassName)} />
            </span>
            {
                title &&
                <TruncatedValue as={"p"} className={"animate-pulse text-xs font-bold text-muted-foreground"}>
                    {title}
                </TruncatedValue>
            }
        </div>
    );
}

export default withLanguage("src/modules/core/components/custom/loader/loader.tsx")(Loader);
