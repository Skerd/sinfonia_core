import type { ReactNode } from "react";
import { generateRandomString } from "@coreModule/helpers/general";
import { LockKeyhole } from "lucide-react";
import withLanguage, { type WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";

type HiddenElementProps = WithLanguageType & {
    children?: ReactNode;
    /** Custom content to show blurred (takes precedence over children when both absent). */
    Render?: ReactNode;
    showLock?: boolean;
    randomLength?: number;
    /** When true and no children/Render, render nothing instead of placeholder. */
    hideAll?: boolean;
};

const LOCK_SIZE = 14;
const DEFAULT_RANDOM_LENGTH = 8;

function HiddenElement({
    children,
    Render,
    showLock = false,
    randomLength = DEFAULT_RANDOM_LENGTH,
    resolveLanguageKey,
    hideAll = false,
}: HiddenElementProps) {
    const hasContent = Boolean(children ?? Render);

    // Render prop path: show blurred custom content (and optional lock overlay)
    if (Render != null && !children) {
        return (
            <div className="relative" role="presentation">
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
    if (!hasContent) {
        if (hideAll) return null;
        return (
            <div className="flex items-center space-x-2">
                {showLock && (
                    <TooltipDisplayer tooltip={resolveLanguageKey("tooltip")}>
                        <LockKeyhole
                            className="cursor-pointer text-muted-foreground"
                            size={LOCK_SIZE}
                        />
                    </TooltipDisplayer>
                )}
                {randomLength > 0 && (
                    <p className="blur-xs select-none" aria-hidden>
                        {generateRandomString(randomLength)}
                    </p>
                )}
            </div>
        );
    }

    return <>{children}</>;
}

export default withLanguage("src/modules/core/components/custom/hiddenElement.tsx")(
    HiddenElement
);