import { useCallback, useMemo, useState } from "react";
import Icon from "@mdi/react";
import { Check, ChevronsUpDown } from "lucide-react";
import { compose } from "redux";
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
import { Button } from "@coreModule/components/ui/button.tsx";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from "@coreModule/components/ui/command.tsx";

// Icon metadata with display names
const iconList = [
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
  // { path: mdiWarehouseOutline, name: "mdiWarehouseOutline", label: "Warehouse Outline" },
  { path: mdiFactory, name: "mdiFactory", label: "Factory" },
  { path: mdiHospital, name: "mdiHospital", label: "Hospital" },
  { path: mdiSchool, name: "mdiSchool", label: "School" },
  // { path: mdiHotel, name: "mdiHotel", label: "Hotel" },
  { path: mdiCar, name: "mdiCar", label: "Car" },
  { path: mdiGarage, name: "mdiGarage", label: "Garage" },
  { path: mdiParking, name: "mdiParking", label: "Parking" },
  { path: mdiElevator, name: "mdiElevator", label: "Elevator" },
  { path: mdiStairs, name: "mdiStairs", label: "Stairs" },
  { path: mdiDoor, name: "mdiDoor", label: "Door" },
  // { path: mdiWindow, name: "mdiWindow", label: "Window" },
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
  // { path: mdiBuilding, name: "mdiBuilding", label: "Building" },
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

type IconPickerProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
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
    (resolveLanguageKey("emptyMessage", true) as string | null) ??
    "No icon found.";

  const getIconLabel = useCallback(
    (iconName: string, fallback: string) => {
      const translated = resolveLanguageKey(`labels.${iconName}`, true);
      return typeof translated === "string" ? translated : fallback;
    },
    [resolveLanguageKey]
  );

  // Find selected icon with flexible matching
  const selectedIcon = value ? iconList.find((icon) => {
    // Exact match
    if (icon.name === value) return true;
    // Case-insensitive match
    if (icon.name.toLowerCase() === value.toLowerCase()) return true;
    // Normalized match (handles kebab-case to camelCase conversion)
    const normalizedValue = normalizeIconName(value);
    if (icon.name === normalizedValue || icon.name.toLowerCase() === normalizedValue.toLowerCase()) return true;
    // Match against label (case-insensitive)
    if (getIconLabel(icon.name, icon.label).toLowerCase() === value.toLowerCase()) return true;
    return false;
  }) : undefined;

  const filteredIcons = useMemo(() => {
    const normalized = searchText.toLowerCase();
    return iconList.filter((icon) =>
      getIconLabel(icon.name, icon.label).toLowerCase().includes(normalized) ||
      icon.name.toLowerCase().includes(normalized)
    );
  }, [searchText, getIconLabel]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2">
            {selectedIcon ? (
              <>
                <Icon path={selectedIcon.path} size={1} />
                <span>{getIconLabel(selectedIcon.name, selectedIcon.label)}</span>
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
                    const isSelected = value ? (
                      icon.name === value ||
                      icon.name.toLowerCase() === value.toLowerCase() ||
                      icon.name === normalizeIconName(value) ||
                      icon.name.toLowerCase() === normalizeIconName(value).toLowerCase() ||
                      getIconLabel(icon.name, icon.label).toLowerCase() === value.toLowerCase()
                    ) : false;
                    return (
                      <div
                        key={icon.name}
                        onClick={() => {
                          onValueChange?.(icon.name);
                          setOpen(false);
                          setSearchText("");
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-4 h-auto cursor-pointer rounded-md border border-transparent hover:bg-accent hover:border-border transition-colors",
                          isSelected && "bg-accent border-border"
                        )}
                      >
                        <div className="relative">
                          <Icon path={icon.path} size={1.5} />
                          {isSelected && (
                            <Check className="absolute -top-1 -right-1 h-3 w-3 text-primary" />
                          )}
                        </div>
                        <span className="text-xs text-center">{getIconLabel(icon.name, icon.label)}</span>
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
  withLanguage("src/modules/core/components/custom/iconPicker.tsx")
)(IconPickerBase);

