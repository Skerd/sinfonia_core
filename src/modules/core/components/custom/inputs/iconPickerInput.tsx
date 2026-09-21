import { useCallback, useMemo, useState, type MouseEvent, type PointerEvent } from "react";
import Icon from "@mdi/react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";

// Common MDI icons for unit types - you can expand this list
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
  // Additional useful icons for unit types
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
} from "@mdi/js";
import { cn } from "@coreModule/components/lib/utils.ts";
import { Popover, PopoverContent, PopoverTrigger } from "@coreModule/components/ui/popover.tsx";
import { useDrawerPortalContainer } from "@coreModule/components/ui/drawer.tsx";
import { Button } from "@coreModule/components/ui/button.tsx";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@coreModule/components/ui/command.tsx";

type IconEntry = { path: string; name: string; label: string };

// Icon metadata with display names
const iconList: IconEntry[] = [
  { path: mdiHome, name: "mdiHome", label: "Home" },
  { path: mdiHomeVariant, name: "mdiHomeVariant", label: "Home Variant" },
  { path: mdiHomeVariantOutline, name: "mdiHomeVariantOutline", label: "Home Variant Outline" },
  { path: mdiHomeOutline, name: "mdiHomeOutline", label: "Home Outline" },
  { path: mdiHomeCircle, name: "mdiHomeCircle", label: "Home Circle" },
  { path: mdiHomeCity, name: "mdiHomeCity", label: "Home City" },
  { path: mdiHomeGroup, name: "mdiHomeGroup", label: "Home Group" },
  { path: mdiHomeModern, name: "mdiHomeModern", label: "Home Modern" },
  { path: mdiHomeAnalytics, name: "mdiHomeAnalytics", label: "Home Analytics" },
  { path: mdiHomeAutomation, name: "mdiHomeAutomation", label: "Home Automation" },
  { path: mdiOfficeBuilding, name: "mdiOfficeBuilding", label: "Office Building" },
  { path: mdiOfficeBuildingOutline, name: "mdiOfficeBuildingOutline", label: "Office Building Outline" },
  { path: mdiStore, name: "mdiStore", label: "Store" },
  { path: mdiStoreOutline, name: "mdiStoreOutline", label: "Store Outline" },
  { path: mdiWarehouse, name: "mdiWarehouse", label: "Warehouse" },
  { path: mdiFactory, name: "mdiFactory", label: "Factory" },
  { path: mdiHospital, name: "mdiHospital", label: "Hospital" },
  { path: mdiSchool, name: "mdiSchool", label: "School" },
  { path: mdiCar, name: "mdiCar", label: "Car" },
  { path: mdiGarage, name: "mdiGarage", label: "Garage" },
  { path: mdiParking, name: "mdiParking", label: "Parking" },
  { path: mdiElevator, name: "mdiElevator", label: "Elevator" },
  { path: mdiStairs, name: "mdiStairs", label: "Stairs" },
  { path: mdiDoor, name: "mdiDoor", label: "Door" },
  { path: mdiBed, name: "mdiBed", label: "Bed" },
  { path: mdiSilverwareForkKnife, name: "mdiSilverwareForkKnife", label: "Kitchen" },
  { path: mdiShower, name: "mdiShower", label: "Shower" },
  { path: mdiWashingMachine, name: "mdiWashingMachine", label: "Washing Machine" },
  { path: mdiAirConditioner, name: "mdiAirConditioner", label: "Air Conditioner" },
  { path: mdiRadiator, name: "mdiRadiator", label: "Radiator" },
  { path: mdiLightbulb, name: "mdiLightbulb", label: "Light" },
  { path: mdiCctv, name: "mdiCctv", label: "CCTV" },
  { path: mdiLock, name: "mdiLock", label: "Lock" },
  { path: mdiKey, name: "mdiKey", label: "Key" },
  { path: mdiMapMarker, name: "mdiMapMarker", label: "Map Marker" },
  { path: mdiMap, name: "mdiMap", label: "Map" },
  { path: mdiCity, name: "mdiCity", label: "City" },
  // Additional unit type icons
  { path: mdiBalcony, name: "mdiBalcony", label: "Balcony" },
  { path: mdiBarn, name: "mdiBarn", label: "Barn" },
  { path: mdiBathtub, name: "mdiBathtub", label: "Bathtub" },
  { path: mdiBlinds, name: "mdiBlinds", label: "Blinds" },
  { path: mdiCabinAFrame, name: "mdiCabinAFrame", label: "Cabin" },
  { path: mdiCamera, name: "mdiCamera", label: "Camera" },
  { path: mdiCounter, name: "mdiCounter", label: "Counter" },
  { path: mdiCurtains, name: "mdiCurtains", label: "Curtains" },
  { path: mdiFan, name: "mdiFan", label: "Fan" },
  { path: mdiFence, name: "mdiFence", label: "Fence" },
  { path: mdiFireplace, name: "mdiFireplace", label: "Fireplace" },
  { path: mdiGate, name: "mdiGate", label: "Gate" },
  { path: mdiLamp, name: "mdiLamp", label: "Lamp" },
  { path: mdiLibrary, name: "mdiLibrary", label: "Library" },
  { path: mdiMailbox, name: "mdiMailbox", label: "Mailbox" },
  { path: mdiMicrowave, name: "mdiMicrowave", label: "Microwave" },
  { path: mdiPool, name: "mdiPool", label: "Pool" },
  { path: mdiSecurity, name: "mdiSecurity", label: "Security" },
  { path: mdiSofa, name: "mdiSofa", label: "Sofa" },
  { path: mdiSolarPanel, name: "mdiSolarPanel", label: "Solar Panel" },
  { path: mdiSpa, name: "mdiSpa", label: "Spa" },
  { path: mdiTable, name: "mdiTable", label: "Table" },
  { path: mdiThermostat, name: "mdiThermostat", label: "Thermostat" },
  { path: mdiToilet, name: "mdiToilet", label: "Toilet" },
  { path: mdiTrashCan, name: "mdiTrashCan", label: "Trash Can" },
];

type IconPickerInputProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /**
   * Passed down by `FormControl`'s Slot. Forwarded to the trigger so the field label points at
   * it and an invalid field draws the same destructive border as every other input.
   */
  id?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  "aria-required"?: boolean | "true" | "false";
} & WithLanguageType;

// Helper function to normalize icon names for comparison
function normalizeIconName(name: string): string {
  // Convert kebab-case to camelCase: "mdi-home" -> "mdiHome"
  return name
    .split('-')
    .map((part, index) =>
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join('');
}

/** Stored values turn up as `mdiHome`, `mdi-home`, a different case, or the icon's own label. */
function matchesIconValue(icon: IconEntry, value: string, label: string): boolean {
  const lowered = value.toLowerCase();
  const normalized = normalizeIconName(value);
  return (
    icon.name === value ||
    icon.name.toLowerCase() === lowered ||
    icon.name === normalized ||
    icon.name.toLowerCase() === normalized.toLowerCase() ||
    label.toLowerCase() === lowered
  );
}

/** Dictionary lookups can miss, or hold a nested object; only usable text gets through. */
function dictText(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

/** Widgets sit inside clickable cards, where a trigger click must not also open the card. */
function stopCardActivation(event: MouseEvent | PointerEvent) {
  event.stopPropagation();
}

function IconPickerInputBase({
  value,
  onValueChange,
  disabled = false,
  placeholder: placeholderProp,
  className,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-required": ariaRequired,
  resolveLanguageKey,
}: IconPickerInputProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const drawerPortalContainer = useDrawerPortalContainer();

  // The caller's own placeholder is the more specific one, so it wins over this dictionary.
  const placeholder =
    placeholderProp ??
    dictText(resolveLanguageKey("placeholder", true)) ??
    "Select an icon...";
  const searchPlaceholder =
    dictText(resolveLanguageKey("searchPlaceholder", true)) ?? "Search icons...";
  const emptyMessage =
    dictText(resolveLanguageKey("emptyMessage", true)) ?? "No icon found.";
  const clearLabel = dictText(resolveLanguageKey("clear", true)) ?? "Clear";

  const getIconLabel = useCallback(
    (iconName: string, fallback: string) =>
      dictText(resolveLanguageKey(`labels.${iconName}`, true)) ?? fallback,
    [resolveLanguageKey]
  );

  const selectedIcon = useMemo(
    () =>
      value
        ? iconList.find((icon) => matchesIconValue(icon, value, getIconLabel(icon.name, icon.label)))
        : undefined,
    [value, getIconLabel]
  );

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) setSearchText("");
  }, []);

  const handleClear = useCallback(
    (event: MouseEvent | PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled) return;
      onValueChange?.("");
      setOpen(false);
    },
    [disabled, onValueChange]
  );

  return (
    <div className="relative w-full min-w-0 max-w-full">
      <Popover modal open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            role="combobox"
            type="button"
            id={id}
            aria-expanded={open}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            aria-required={ariaRequired}
            disabled={disabled}
            onClick={stopCardActivation}
            onPointerDown={stopCardActivation}
            className={cn(
              // Override Button's shrink-0 / min-content so a long label truncates in the form grid.
              'w-full min-w-0 max-w-full shrink justify-start overflow-hidden font-normal',
              'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40',
              !selectedIcon && !value && 'text-muted-foreground',
              // Room for the trailing controls, which sit above the trigger rather than inside it.
              value ? 'pr-12' : 'pr-8',
              className
            )}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-left">
              {selectedIcon ? (
                <>
                  <Icon path={selectedIcon.path} size={0.7} className="shrink-0" />
                  <span className="truncate">{getIconLabel(selectedIcon.name, selectedIcon.label)}</span>
                </>
              ) : (
                /* An unknown stored value is still shown, so a bad icon name is visible rather than silent. */
                <span className={cn("truncate", value && "text-muted-foreground italic")}>
                  {value || placeholder}
                </span>
              )}
            </span>
          </Button>
        </PopoverTrigger>
        {/* Overlaid instead of nested: interactive content inside the trigger button would be
            invalid markup, and a real button keeps clearing reachable from the keyboard. */}
        <div className="pointer-events-none absolute inset-y-0 end-2.5 flex items-center gap-1">
          {value ? (
            <button
              type="button"
              aria-label={clearLabel}
              title={clearLabel}
              disabled={disabled}
              className={cn(
                'rounded-sm p-0.5 text-muted-foreground',
                disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'pointer-events-auto cursor-pointer hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              )}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={handleClear}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </div>
        <PopoverContent
          className="flex max-h-[min(24rem,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] min-w-72 max-w-[min(90vw,28rem)] flex-col overflow-hidden p-0"
          align="start"
          collisionPadding={8}
          container={drawerPortalContainer?.current ?? undefined}
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Command className="flex h-auto min-h-0 w-full min-w-0 flex-col overflow-hidden">
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchText}
              onValueChange={setSearchText}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {/* cmdk finds its items wherever they sit, so the grid can wrap them. */}
                <div className="grid grid-cols-3 gap-1">
                  {iconList.map((icon) => {
                    const label = getIconLabel(icon.name, icon.label);
                    const isSelected = icon.name === selectedIcon?.name;
                    return (
                      <CommandItem
                        key={icon.name}
                        // Searchable by icon name and by the translated label, in any language.
                        value={icon.name}
                        keywords={[label, icon.label]}
                        onSelect={() => {
                          onValueChange?.(icon.name);
                          setOpen(false);
                        }}
                        className={cn(
                          "h-auto cursor-pointer flex-col justify-center gap-1.5 rounded-md border border-transparent p-2 text-center",
                          isSelected && "border-border bg-muted"
                        )}
                      >
                        <span className="relative">
                          <Icon path={icon.path} size={1.2} />
                          {isSelected && (
                            <Check className="absolute -top-1 -right-1 h-3 w-3 text-primary" />
                          )}
                        </span>
                        <span className="w-full truncate text-xs">{label}</span>
                      </CommandItem>
                    );
                  })}
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export const IconPickerInput = withLanguage("src/modules/core/components/custom/inputs/iconPickerInput.tsx")(IconPickerInputBase);
