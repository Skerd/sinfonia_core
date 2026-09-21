import {IconDeviceDesktop, IconDeviceMobile, IconDeviceTablet} from "@tabler/icons-react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {PREVIEW_DEVICES, type PreviewDevice, type PreviewDeviceId} from "./previewDevice.ts";

const ICONS = {
    desktop: IconDeviceDesktop,
    tablet: IconDeviceTablet,
    mobile: IconDeviceMobile,
} as const;

/** Desktop / tablet / mobile, for any pane that renders a preview. */
export default function DeviceToggle({
    device,
    onSelect,
    className,
}: {
    device: PreviewDevice;
    onSelect: (id: PreviewDeviceId) => void;
    className?: string;
}) {
    return (
        <div className={cn("flex shrink-0 items-center gap-0.5", className)}>
            {PREVIEW_DEVICES.map((option) => {
                const Icon = ICONS[option.id];
                const active = option.id === device.id;
                return (
                    <TooltipDisplayer
                        key={option.id}
                        tooltip={
                            option.width
                                ? `${option.label} — ${option.width}×${option.height}`
                                : `${option.label} — fills the pane`
                        }
                    >
                        <button
                            type="button"
                            aria-label={`${option.label} preview`}
                            aria-pressed={active}
                            onClick={() => onSelect(option.id)}
                            className={cn(
                                "rounded p-1 transition-colors",
                                active
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <Icon className="size-3.5" />
                        </button>
                    </TooltipDisplayer>
                );
            })}
        </div>
    );
}
