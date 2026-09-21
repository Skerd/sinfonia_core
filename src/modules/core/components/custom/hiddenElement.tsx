import { useMemo, type ReactNode } from "react";
import {generateRandomString} from "@coreModule/helpers/general/random.ts";
import { LockKeyhole } from "lucide-react";
import withLanguage, { type WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

type HiddenElementProps = WithLanguageType & {
    children?: ReactNode;
    /**
     * Blurred placeholder shown in place of `children` when `children` is falsy
     * (e.g. an access check like `sanitizedUsers.photo && <RealAvatar/>` resolving
     * to `false`). Ignored once `children` is truthy -- `children` always wins.
     */
    Render?: ReactNode;
    showLock?: boolean;
    randomLength?: number;
    /** When true and no children/Render, render nothing instead of placeholder. */
    hideAll?: boolean;
    className?: string;
};

const LOCK_SIZE = 14;
const DEFAULT_RANDOM_LENGTH = 0;

function HiddenElement({
    children,
    Render,
    showLock = false,
    randomLength = DEFAULT_RANDOM_LENGTH,
    resolveLanguageKey,
    hideAll = false,
    className,
}: HiddenElementProps) {
    // Generated once per length: calling this in the render body reshuffled the blurred
    // placeholder on every re-render, which reads as flicker behind the blur.
    const placeholder = useMemo(
        () => (randomLength > 0 ? generateRandomString(randomLength) : ""),
        [randomLength]
    );

    // Render prop path: show blurred custom content (and optional lock overlay)
    if (Render != null && !children) {
        return (
            <div className={cn("relative", className)} role="presentation">
                <div className="blur-sm" aria-hidden>
                    {Render}
                </div>
                {showLock && (
                    <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        aria-hidden
                    >
                        <LockKeyhole size={LOCK_SIZE} />
                    </div>
                )}
            </div>
        );
    }

    // No content: either hide completely or show placeholder
    if (!children) {
        if (hideAll) return null;
        return (
            <div className={cn("flex items-center gap-x-2", className)}>
                {showLock && (
                    <TooltipDisplayer tooltip={resolveLanguageKey("tooltip")}>
                        <LockKeyhole
                            className="cursor-help text-muted-foreground"
                            size={LOCK_SIZE}
                        />
                    </TooltipDisplayer>
                )}
                {randomLength > 0 && (
                    <TooltipDisplayer tooltip={resolveLanguageKey("tooltip")}>
                        <p className="blur-xs select-none" aria-hidden>
                            {placeholder}
                        </p>
                    </TooltipDisplayer>
                )}
            </div>
        );
    }

    return <>{children}</>;
}

export default withLanguage("src/modules/core/components/custom/hiddenElement.tsx")(
    HiddenElement
);