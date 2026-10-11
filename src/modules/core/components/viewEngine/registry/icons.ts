import type {ComponentType} from "react";
import * as TablerIcons from "@tabler/icons-react";

/** Icons from view configs (`widgetProps.icon` / header badges). Tabler forwardRef components. */
export type ViewConfigIcon = ComponentType<{className?: string}>;

function isTablerIconExport(v: unknown): v is ViewConfigIcon {
    return typeof v === "object" && v !== null && typeof (v as {render?: unknown}).render === "function";
}

/**
 * Lucide-style / legacy view-config names → `@tabler/icons-react` export names.
 * Tokens that already match Tabler (`#IconLabel` → `IconLabel`) or `Icon` + PascalCase (`#Tag` → `IconTag`) need no entry.
 */
export const LEGACY_TO_TABLER_EXPORT: Record<string, string> = {
    Accessibility: "IconAccessible",
    /** Lucide `AlarmClock`; Tabler exposes `IconAlarm` / `IconAlarmSnooze`, not `IconAlarmClock`. */
    AlarmClock: "IconAlarm",
    /** Lucide `Timer`; Tabler has `IconStopwatch`, not `IconTimer`. */
    Timer: "IconStopwatch",
    ArrowUpDown: "IconArrowsUpDown",
    Banknote: "IconCashBanknote",
    BedDouble: "IconBed",
    BookMarked: "IconBookmark",
    Building2: "IconBuildingCommunity",
    CheckCircle: "IconCircleCheck",
    /** Lucide `CircleSlash`; Tabler's "crossed-out circle" is `IconCircleOff`. */
    CircleSlash: "IconCircleOff",
    DollarSign: "IconCurrencyDollar",
    DoorOpen: "IconDoor",
    Droplets: "IconDroplet",
    /** Lucide `FolderTree`; Tabler uses hierarchy / multi-folder icons. */
    FolderTree: "IconFolders",
    Globe: "IconWorld",
    Landmark: "IconBuildingMonument",
    /** Lucide `Languages` (plural); Tabler's is singular. */
    Languages: "IconLanguage",
    Layers: "IconStack",
    ListOrdered: "IconListNumbers",
    /** Lucide `Megaphone`; Tabler calls it a speakerphone. */
    Megaphone: "IconSpeakerphone",
    MessageSquare: "IconMessage",
    Percent: "IconPercentage",
    /** Tabler export is `IconPercentage`; bare `IconPercent` does not exist. */
    IconPercent: "IconPercentage",
    /** Lucide `Play`; bare `IconPlay` does not exist — the media glyph is `IconPlayerPlay`. */
    Play: "IconPlayerPlay",
    /** Lucide `RefreshCw` / `RefreshCcw`; Tabler has no direction suffix. */
    RefreshCw: "IconRefresh",
    RefreshCcw: "IconRefresh",
    ShieldAlert: "IconShieldExclamation",
    TreePine: "IconTrees",
    /** Lucide renamed `AlertTriangle` → `TriangleAlert`; Tabler kept the old order. */
    TriangleAlert: "IconAlertTriangle",
    Waves: "IconRipple",
    XCircle: "IconCircleX",
};

function exportNameForToken(raw: string): string {
    const mapped = LEGACY_TO_TABLER_EXPORT[raw];
    if (mapped) return mapped;
    return raw.startsWith("Icon") ? raw : `Icon${raw}`;
}

/** Runtime overrides from `registerIcon` (take precedence over the Tabler lookup). */
const ICON_OVERRIDES: Record<string, ViewConfigIcon> = {};

export function registerIcon(token: string, icon: ViewConfigIcon): void {
    ICON_OVERRIDES[token] = icon;
}

/**
 * Resolves `#…` strings from view configs to Tabler icon components.
 *
 * Uses a namespace import and runtime property access, so bundlers typically cannot tree-shake unused icons
 * (unlike `import { IconX } from "@tabler/icons-react"`). Prefer this for ergonomics; use explicit imports
 * only if bundle size for this chunk is critical.
 */
export function resolveIcon(token: string): ViewConfigIcon | null {
    if (!token || typeof token !== "string") return null;
    const registered = ICON_OVERRIDES[token];
    if (registered) return registered;

    const raw = token.startsWith("#") ? token.slice(1) : token;
    if (!raw) return null;

    const candidate = TablerIcons[exportNameForToken(raw) as keyof typeof TablerIcons];
    return isTablerIconExport(candidate) ? candidate : null;
}

/** `resolveIcon` for an optional token; `undefined` when absent or unknown (the shape `Icon` props take). */
export function iconOrUndefined(token: unknown): ViewConfigIcon | undefined {
    return typeof token === "string" && token.length > 0 ? (resolveIcon(token) ?? undefined) : undefined;
}
