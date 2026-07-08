import { useState, useMemo, useCallback } from "react";
import Icon from "@mdi/react";
import { cn } from "@coreModule/components/lib/utils.ts";
import { Button } from "@coreModule/components/ui/button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@coreModule/components/ui/popover.tsx";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from "@coreModule/components/ui/command.tsx";
import { Check, ChevronsUpDown } from "lucide-react";
import { compose } from "redux";
import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";

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
} from "@mdi/js";

/** Icon entry: path from MDI, name used as value and i18n key */
const ICON_LIST: { path: string; name: string }[] = [
  { path: mdiHome, name: "mdiHome" },
  { path: mdiHomeVariant, name: "mdiHomeVariant" },
  { path: mdiHomeVariantOutline, name: "mdiHomeVariantOutline" },
  { path: mdiHomeOutline, name: "mdiHomeOutline" },
  { path: mdiHomeCircle, name: "mdiHomeCircle" },
  { path: mdiHomeCity, name: "mdiHomeCity" },
  { path: mdiHomeGroup, name: "mdiHomeGroup" },
  { path: mdiHomeModern, name: "mdiHomeModern" },
  { path: mdiHomeAnalytics, name: "mdiHomeAnalytics" },
  { path: mdiHomeAutomation, name: "mdiHomeAutomation" },
  { path: mdiOfficeBuilding, name: "mdiOfficeBuilding" },
  { path: mdiOfficeBuildingOutline, name: "mdiOfficeBuildingOutline" },
  { path: mdiStore, name: "mdiStore" },
  { path: mdiStoreOutline, name: "mdiStoreOutline" },
  { path: mdiWarehouse, name: "mdiWarehouse" },
  { path: mdiFactory, name: "mdiFactory" },
  { path: mdiHospital, name: "mdiHospital" },
  { path: mdiSchool, name: "mdiSchool" },
  { path: mdiCar, name: "mdiCar" },
  { path: mdiGarage, name: "mdiGarage" },
  { path: mdiParking, name: "mdiParking" },
  { path: mdiElevator, name: "mdiElevator" },
  { path: mdiStairs, name: "mdiStairs" },
  { path: mdiDoor, name: "mdiDoor" },
  { path: mdiBed, name: "mdiBed" },
  { path: mdiSilverwareForkKnife, name: "mdiSilverwareForkKnife" },
  { path: mdiShower, name: "mdiShower" },
  { path: mdiWashingMachine, name: "mdiWashingMachine" },
  { path: mdiAirConditioner, name: "mdiAirConditioner" },
  { path: mdiRadiator, name: "mdiRadiator" },
  { path: mdiLightbulb, name: "mdiLightbulb" },
  { path: mdiCctv, name: "mdiCctv" },
  { path: mdiLock, name: "mdiLock" },
  { path: mdiKey, name: "mdiKey" },
  { path: mdiMapMarker, name: "mdiMapMarker" },
  { path: mdiMap, name: "mdiMap" },
  { path: mdiCity, name: "mdiCity" },
  { path: mdiBalcony, name: "mdiBalcony" },
  { path: mdiBarn, name: "mdiBarn" },
  { path: mdiBathtub, name: "mdiBathtub" },
  { path: mdiBlinds, name: "mdiBlinds" },
  { path: mdiCabinAFrame, name: "mdiCabinAFrame" },
  { path: mdiCamera, name: "mdiCamera" },
  { path: mdiCounter, name: "mdiCounter" },
  { path: mdiCurtains, name: "mdiCurtains" },
  { path: mdiFan, name: "mdiFan" },
  { path: mdiFence, name: "mdiFence" },
  { path: mdiFireplace, name: "mdiFireplace" },
  { path: mdiGate, name: "mdiGate" },
  { path: mdiLamp, name: "mdiLamp" },
  { path: mdiLibrary, name: "mdiLibrary" },
  { path: mdiMailbox, name: "mdiMailbox" },
  { path: mdiMicrowave, name: "mdiMicrowave" },
  { path: mdiPool, name: "mdiPool" },
  { path: mdiSecurity, name: "mdiSecurity" },
  { path: mdiSofa, name: "mdiSofa" },
  { path: mdiSolarPanel, name: "mdiSolarPanel" },
  { path: mdiSpa, name: "mdiSpa" },
  { path: mdiTable, name: "mdiTable" },
  { path: mdiThermostat, name: "mdiThermostat" },
  { path: mdiToilet, name: "mdiToilet" },
  { path: mdiTrashCan, name: "mdiTrashCan" },
];

/** Converts kebab-case to camelCase for value comparison */
function normalizeIconName(name: string): string {
  return name
    .split("-")
    .map((part, index) =>
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("");
}

/** Fallback label when translation is missing: "mdiHome" → "Home" */
function formatIconNameFallback(name: string): string {
  const withoutMdi = name.replace(/^mdi/, "");
  const withSpaces = withoutMdi.replace(/([A-Z])/g, " $1").trim();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase();
}

/** Single source of truth for whether an icon is selected (avoids duplication and drift) */
function isIconSelected(value: string | undefined, iconName: string): boolean {
  if (!value) return false;
  const normalized = normalizeIconName(value);
  return (
    iconName === value ||
    iconName.toLowerCase() === value.toLowerCase() ||
    iconName === normalized ||
    iconName.toLowerCase() === normalized.toLowerCase()
  );
}

/** Resolves which icon (if any) matches the current value (by name or by translated label) */
function findSelectedIcon(
  iconList: { path: string; name: string }[],
  value: string | undefined,
  getLabel: (name: string) => string
): { path: string; name: string } | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  return iconList.find(
    (icon) =>
      isIconSelected(value, icon.name) || getLabel(icon.name).toLowerCase() === v
  );
}

type IconPickerProps = WithLanguageType & {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

function IconPickerBase({
  value,
  onValueChange,
  disabled = false,
  placeholder: placeholderProp,
  className,
  resolveLanguageKey,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const placeholder =
    (resolveLanguageKey("placeholder", true) as string | null) ??
    placeholderProp ??
    "Select an icon...";
  const searchPlaceholder =
    (resolveLanguageKey("searchPlaceholder", true) as string | null) ??
    "Search icons...";
  const emptyMessage =
    (resolveLanguageKey("emptyMessage", true) as string | null) ?? "No icon found.";

  const getLabel = useCallback(
    (iconName: string): string => {
      const translated = resolveLanguageKey(`labels.${iconName}`, true);
      if (typeof translated === "string") return translated;
      return formatIconNameFallback(iconName);
    },
    [resolveLanguageKey]
  );

  const selectedIcon = useMemo(
    () => findSelectedIcon(ICON_LIST, value, getLabel),
    [value, getLabel]
  );

  const filteredIcons = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return ICON_LIST;
    return ICON_LIST.filter(
      (icon) =>
        icon.name.toLowerCase().includes(q) ||
        getLabel(icon.name).toLowerCase().includes(q)
    );
  }, [searchText, getLabel]);

  const handleSelect = useCallback(
    (iconName: string) => {
      onValueChange?.(iconName);
      setOpen(false);
      setSearchText("");
    },
    [onValueChange]
  );

  const displayLabel = selectedIcon ? getLabel(selectedIcon.name) : null;
  const ariaLabel =
    (resolveLanguageKey("placeholder", true) as string | null) ?? placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2">
            {selectedIcon ? (
              <>
                <Icon path={selectedIcon.path} size={1} />
                <span>{displayLabel}</span>
              </>
            ) : value ? (
              <span className="text-muted-foreground italic">{value}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchText}
            onValueChange={setSearchText}
          />
          <CommandList>
            {filteredIcons.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                <div className="grid grid-cols-3 gap-2 p-2">
                  {filteredIcons.map((icon) => {
                    const selected =
                      isIconSelected(value, icon.name) ||
                      (value?.toLowerCase() === getLabel(icon.name).toLowerCase());
                    return (
                      <div
                        key={icon.name}
                        role="option"
                        aria-selected={selected}
                        onClick={() => handleSelect(icon.name)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelect(icon.name);
                          }
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-4 h-auto cursor-pointer rounded-md border border-transparent hover:bg-accent hover:border-border transition-colors",
                          selected && "bg-accent border-border"
                        )}
                      >
                        <div className="relative">
                          <Icon path={icon.path} size={1.5} />
                          {selected && (
                            <Check className="absolute -top-1 -right-1 h-3 w-3 text-primary" />
                          )}
                        </div>
                        <span className="text-xs text-center">
                          {getLabel(icon.name)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export const IconPicker = compose(
  withLanguage("src/modules/core/components/custom/mdiIcons/iconPicker.tsx")
)(IconPickerBase) as React.ComponentType<Omit<IconPickerProps, keyof WithLanguageType>>;
