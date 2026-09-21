import {Kbd, KbdGroup} from "@coreModule/components/ui/kbd.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

/**
 * Asks the palette to open from anywhere, without threading state through the shell.
 * Kept here rather than in `commandPalette.tsx` so a dispatcher does not pull the whole
 * palette (and the sidebar contribution registry behind it) into its bundle.
 */
export const COMMAND_PALETTE_OPEN_EVENT = "panel:open-command-palette";

/**
 * Whether the platform's command key is ⌘ rather than Ctrl. `userAgentData` first, since
 * `navigator.platform` is deprecated; both are absent under a non-browser runtime.
 */
function detectApplePlatform(): boolean {
    if (typeof navigator === "undefined") return false;
    const platform =
        (navigator as Navigator & {userAgentData?: {platform?: string}}).userAgentData?.platform
        || navigator.platform
        || "";
    return /mac|iphone|ipad|ipod/i.test(platform);
}

/** Resolved once: the platform cannot change while the tab is open. */
const IS_APPLE_PLATFORM = detectApplePlatform();

/** `⌘` on Apple platforms, `Ctrl` everywhere else. */
export const COMMAND_MODIFIER_LABEL = IS_APPLE_PLATFORM ? "⌘" : "Ctrl";

/**
 * The palette's shortcut badge. Every trigger showed a hardcoded `⌘ K`, which named the wrong
 * key for every Windows and Linux user; this is the one place that decides what it says.
 */
export function CommandPaletteKbd({className}: {className?: string}) {
    return (
        <KbdGroup className={cn("pointer-events-none", className)}>
            <Kbd>{COMMAND_MODIFIER_LABEL}</Kbd>
            <Kbd>K</Kbd>
        </KbdGroup>
    );
}

export default CommandPaletteKbd;
