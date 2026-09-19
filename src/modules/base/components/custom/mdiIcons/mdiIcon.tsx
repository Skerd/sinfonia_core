import Icon from "@mdi/react";
import { cn } from "@coreModule/components/lib/utils.ts";
import {
    mdiHome,
    mdiHomeVariant,
    mdiOfficeBuilding,
    mdiStore,
    mdiWarehouse,
    mdiFactory,
    mdiHospital,
    mdiSchool,
    mdiCar,
    mdiGarage,
    mdiParking,
    mdiElevator,
    mdiStairs,
    mdiDoor,
    mdiBed,
    mdiSilverwareForkKnife,
    mdiShower,
    mdiWashingMachine,
    mdiAirConditioner,
    mdiRadiator,
    mdiLightbulb,
    mdiCctv,
    mdiLock,
    mdiKey,
    mdiMapMarker,
    mdiMap,
    mdiCity,
    mdiHomeGroup,
    mdiHomeModern,
    mdiHomeOutline,
    mdiHomeCircle,
    mdiHomeCity,
    mdiHomeAnalytics,
    mdiHomeAutomation,
    mdiHomeVariantOutline,
    mdiOfficeBuildingOutline,
    mdiStoreOutline,
    mdiBalcony,
    mdiBarn,
    mdiBathtub,
    mdiBlinds,
    mdiCabinAFrame,
    mdiCamera,
    mdiCounter,
    mdiCurtains,
    mdiFan,
    mdiFence,
    mdiFireplace,
    mdiGate,
    mdiLamp,
    mdiLibrary,
    mdiMailbox,
    mdiMicrowave,
    mdiPool,
    mdiSecurity,
    mdiSofa,
    mdiSolarPanel,
    mdiSpa,
    mdiTable,
    mdiThermostat,
    mdiToilet,
    mdiTrashCan,
    mdiHomeFloor2,
    mdiCrown,
    mdiFlower,
    mdiHomeHeart,
    mdiStorefront,
    mdiShopping,
    mdiAccountGroup,
    mdiCarMultiple,
    mdiMotorbike,
    mdiBike,
    mdiGarageOpen,
    mdiGarageVariant,
    mdiArchive,
    mdiPackageDown,
    mdiLocker,
    mdiTree,
    mdiTreeOutline,
    mdiSprout,
    mdiDumbbell,
    mdiHotTub,
    mdiSlide,
    mdiDoorOpen,
    mdiFlash,
    mdiMapMarkerPath,
} from "@mdi/js";
import { CircleQuestionMark } from "lucide-react";
import { forwardRef, type ReactNode } from "react";

/** Icon name → path mapping. Aliases (e.g. mdiParkingCovered → mdiParking) use the same path. */
const iconMap: Record<string, string> = {
    mdiHome,
    mdiHomeVariant,
    mdiOfficeBuilding,
    mdiStore,
    mdiWarehouse,
    mdiFactory,
    mdiHospital,
    mdiSchool,
    mdiCar,
    mdiGarage,
    mdiParking,
    mdiElevator,
    mdiStairs,
    mdiDoor,
    mdiBed,
    mdiSilverwareForkKnife,
    mdiShower,
    mdiWashingMachine,
    mdiAirConditioner,
    mdiRadiator,
    mdiLightbulb,
    mdiCctv,
    mdiLock,
    mdiKey,
    mdiMapMarker,
    mdiMap,
    mdiCity,
    mdiHomeGroup,
    mdiHomeModern,
    mdiHomeOutline,
    mdiHomeCircle,
    mdiHomeCity,
    mdiHomeAnalytics,
    mdiHomeAutomation,
    mdiHomeVariantOutline,
    mdiOfficeBuildingOutline,
    mdiStoreOutline,
    mdiBalcony,
    mdiBarn,
    mdiBathtub,
    mdiBlinds,
    mdiCabinAFrame,
    mdiCamera,
    mdiCounter,
    mdiCurtains,
    mdiFan,
    mdiFence,
    mdiFireplace,
    mdiGate,
    mdiLamp,
    mdiLibrary,
    mdiMailbox,
    mdiMicrowave,
    mdiPool,
    mdiSecurity,
    mdiSofa,
    mdiSolarPanel,
    mdiSpa,
    mdiTable,
    mdiThermostat,
    mdiToilet,
    mdiTrashCan,
    // Additional icons from initializer
    mdiHomeFloor2,
    mdiCrown,
    mdiFlower,
    mdiHomeHeart,
    mdiStorefront,
    mdiShopping,
    mdiAccountGroup,
    mdiCarMultiple,
    mdiMotorbike,
    mdiBike,
    mdiGarageOpen,
    mdiGarageVariant,
    mdiArchive,
    mdiPackageDown,
    mdiLocker,
    mdiTree,
    mdiTreeOutline,
    mdiSprout,
    mdiDumbbell,
    mdiHotTub,
    mdiSlide,
    mdiDoorOpen,
    mdiFlash,
    mdiMapMarkerPath,
    /** Alias: @mdi/js has no mdiParkingCovered; reuse mdiParking path */
    mdiParkingCovered: mdiParking,
};

/** Known icon names (keys of iconMap). Use for type-safe icon props. */
export type MdiIconName = keyof typeof iconMap;

const pathCache = new Map<string, string | null>();

/**
 * Resolves icon name to MDI path. Cached for repeated lookups.
 * Accepts "mdiHome" (camelCase) or "mdi-home" (kebab-case).
 */
function getIconPath(iconName: string | undefined | null): string | null {
    if (iconName == null || iconName === "") return null;

    const cached = pathCache.get(iconName);
    if (cached !== undefined) return cached;

    let path: string | null;

    if (!iconName.includes("-")) {
        path = iconMap[iconName] ?? null;
    } else {
        const parts = iconName.split("-");
        if (parts[0] !== "mdi") {
            path = null;
        } else {
            const normalizedName =
                "mdi" +
                parts
                    .slice(1)
                    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
                    .join("");
            path = iconMap[normalizedName] ?? null;
        }
    }

    pathCache.set(iconName, path);
    return path;
}

export type MdiIconProps = {
    /** Icon name (e.g. "mdiHome" or "mdi-home"). See MdiIconName for known names. */
    icon: string | undefined | null;
    /** Size in em units (default: 1). Affects both icon and fallback. */
    size?: number;
    /** Additional CSS classes */
    className?: string;
    /** Fill color (e.g. "currentColor", "#333"). */
    color?: string;
    /** When true, show default fallback (question mark) if icon is missing (default: false). */
    showFallback?: boolean;
    /** Custom fallback when icon is missing. Overrides showFallback's default. */
    fallback?: ReactNode;
    /** Accessible label for the icon. Prefer for meaningful icons. */
    "aria-label"?: string;
    /** Set to true when icon is decorative so it is hidden from assistive tech. */
    "aria-hidden"?: boolean;
    /** Tooltip / title (e.g. for hover). */
    title?: string;
};

const DEFAULT_FALLBACK = <CircleQuestionMark className="size-full" />;

/**
 * Reusable MDI Icon component. Renders Material Design Icons by name; supports
 * fallback when the icon is missing and optional accessibility props.
 *
 * @example
 * ```tsx
 * <MdiIcon icon="mdiHome" size={1.5} />
 * <MdiIcon icon="mdi-home" size={1} className="text-primary" />
 * <MdiIcon icon="mdiOfficeBuilding" size={2} showFallback />
 * <MdiIcon icon={value} fallback={<span>No icon</span>} />
 * ```
 */
export const MdiIcon = forwardRef<SVGSVGElement, MdiIconProps>(function MdiIcon(
    {
        icon,
        size = 1,
        className,
        color,
        showFallback = false,
        fallback,
        "aria-label": ariaLabel,
        "aria-hidden": ariaHidden,
        title,
    },
    ref
) {
    const iconPath = getIconPath(icon);

    if (iconPath) {
        return (
            <Icon
                ref={ref as React.RefObject<SVGSVGElement> | undefined}
                path={iconPath}
                size={size}
                className={className}
                color={color}
                aria-label={ariaLabel}
                aria-hidden={ariaHidden}
                title={title}
            />
        );
    }

    const showPlaceholder = showFallback || fallback !== undefined;
    if (!showPlaceholder) return null;

    const content =
        fallback !== undefined ? fallback : DEFAULT_FALLBACK;
    const sizeEm = `${size}em`;

    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center justify-center text-muted-foreground",
                className
            )}
            style={{ width: sizeEm, height: sizeEm, minWidth: sizeEm, minHeight: sizeEm }}
            aria-hidden={ariaHidden ?? true}
            role={ariaLabel ? "img" : undefined}
            aria-label={ariaLabel}
            title={title}
        >
            {content}
        </span>
    );
});

/**
 * Export the icon map and helper function for advanced usage
 */
export { iconMap, getIconPath };
