import * as React from "react";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@coreModule/components/ui/command.tsx";
import useSelectedLanguage, { LanguageDictionary } from "@coreModule/helpers/hooks/useSelectedLanguage.ts";

const LANGUAGE_PATH = "src/modules/core/components/custom/inputs/phoneInput.tsx";

const DEFAULT_TEXT = {
    searchCountry: "Search country...",
    noCountryFound: "No country found.",
    selectCountry: "Select country",
} as const;

type TextKey = keyof typeof DEFAULT_TEXT;

function getLanguageText(currentLanguage: LanguageDictionary | null, key: TextKey): string {
    const value = currentLanguage?.[key];
    return typeof value === "string" && value !== "" ? value : DEFAULT_TEXT[key];
}

/**
 * Country names in the user's language. `react-phone-number-input` bundles English and ships
 * translations for a subset of the panel's locales; anything else keeps the English names.
 * Loaded on demand so no locale but the visitor's own reaches the bundle.
 */
const COUNTRY_LABEL_LOADERS: Record<string, () => Promise<{ default: RPNInput.Labels }>> = {
    de: () => import("react-phone-number-input/locale/de.json"),
    fr: () => import("react-phone-number-input/locale/fr.json"),
    it: () => import("react-phone-number-input/locale/it.json"),
};

const countryLabelCache = new Map<string, RPNInput.Labels>();

function useCountryLabels(languageCode: string | undefined): RPNInput.Labels | undefined {
    const locale = languageCode?.slice(0, 2).toLowerCase() ?? "";
    const key = locale in COUNTRY_LABEL_LOADERS ? locale : "";
    const [labels, setLabels] = React.useState(() => countryLabelCache.get(key));

    React.useEffect(() => {
        const cached = countryLabelCache.get(key);
        setLabels(cached);
        if (!key || cached) return;

        let active = true;
        COUNTRY_LABEL_LOADERS[key]()
            .then((module) => {
                countryLabelCache.set(key, module.default);
                if (active) setLabels(module.default);
            })
            // A failed chunk only costs the translation, so the English names stand in.
            .catch(() => undefined);
        return () => {
            active = false;
        };
    }, [key]);

    return labels;
}

type PhoneInputProps = Omit<
    React.ComponentProps<"input">,
    "onChange" | "value" | "ref"
> &
    Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void;
};

const PhoneInput = React.forwardRef<React.ComponentRef<typeof RPNInput.default>, PhoneInputProps>(
    function PhoneInput({ className, onChange, value, ...props }, ref) {
        const { currentLanguage, languageCode } = useSelectedLanguage<LanguageDictionary>(LANGUAGE_PATH);
        const countryLabels = useCountryLabels(languageCode);

        const searchCountryPlaceholder = getLanguageText(currentLanguage, "searchCountry");
        const noCountryFoundText = getLanguageText(currentLanguage, "noCountryFound");
        const selectCountryLabel = getLanguageText(currentLanguage, "selectCountry");

        const countrySelect = React.useCallback(
            (countrySelectProps: CountrySelectProps) => (
                <CountrySelect
                    {...countrySelectProps}
                    searchCountryPlaceholder={searchCountryPlaceholder}
                    noCountryFoundText={noCountryFoundText}
                    selectCountryLabel={selectCountryLabel}
                />
            ),
            [searchCountryPlaceholder, noCountryFoundText, selectCountryLabel]
        );

        return (
            <RPNInput.default
                ref={ref}
                className={cn("flex", className)}
                flagComponent={FlagComponent}
                countrySelectComponent={countrySelect}
                inputComponent={InputComponent}
                smartCaret={false}
                value={value || undefined}
                /**
                 * Handles the onChange event.
                 *
                 * react-phone-number-input might trigger the onChange event as undefined
                 * when a valid phone number is not entered. To prevent this,
                 * the value is coerced to an empty string.
                 */
                onChange={(next) => onChange?.(next || ("" as RPNInput.Value))}
                // Only when loaded — the library falls back to its own English names otherwise.
                {...(countryLabels ? { labels: countryLabels } : {})}
                {...props}
            />
        );
    },
);
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<
    HTMLInputElement,
    React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
    <Input
        className={cn("rounded-e-lg rounded-s-none", className)}
        {...props}
        ref={ref}
    />
));
InputComponent.displayName = "InputComponent";

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
    disabled?: boolean;
    /** Absent while the number carries no country (the library's "international" state). */
    value?: RPNInput.Country;
    options: CountryEntry[];
    onChange: (country: RPNInput.Country) => void;
    searchCountryPlaceholder?: string;
    noCountryFoundText?: string;
    selectCountryLabel?: string;
};

const CountrySelect = ({
                           disabled,
                           value: selectedCountry,
                           options: countryList,
                           onChange,
                           searchCountryPlaceholder = DEFAULT_TEXT.searchCountry,
                           noCountryFoundText = DEFAULT_TEXT.noCountryFound,
                           selectCountryLabel = DEFAULT_TEXT.selectCountry,
                       }: CountrySelectProps) => {
    const listRef = React.useRef<HTMLDivElement>(null);
    const [searchValue, setSearchValue] = React.useState("");
    const [isOpen, setIsOpen] = React.useState(false);

    /** The library's list carries an "international" entry with no country; it has no row here. */
    const countries = React.useMemo(
        () =>
            countryList.flatMap(({ value, label }) =>
                value
                    ? [{ country: value, label, callingCode: RPNInput.getCountryCallingCode(value) }]
                    : [],
            ),
        [countryList],
    );
    const selected = countries.find((entry) => entry.country === selectedCountry);

    // A fresh search has to start at the top; the list keeps the previous offset otherwise.
    React.useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = 0;
    }, [searchValue]);

    return (
        <Popover
            open={isOpen}
            modal
            onOpenChange={(open: boolean) => {
                setIsOpen(open);
                if (open) setSearchValue("");
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="flex gap-1 rounded-e-none rounded-s-lg border-r-0 px-3 focus:z-10"
                    disabled={disabled}
                    // The flag alone leaves the trigger unnamed for screen readers.
                    aria-label={
                        selected
                            ? `${selectCountryLabel}: ${selected.label} (+${selected.callingCode})`
                            : selectCountryLabel
                    }
                >
                    <FlagComponent
                        country={selectedCountry as RPNInput.Country}
                        countryName={selected?.label ?? selectedCountry ?? ""}
                    />
                    <ChevronsUpDown
                        className={cn(
                            "-mr-2 size-4 opacity-50",
                            disabled ? "hidden" : "opacity-100",
                        )}
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                {/* Opens on the current country; `defaultValue` leaves the arrow keys free to move on. */}
                <Command defaultValue={selectedCountry}>
                    <CommandInput
                        value={searchValue}
                        onValueChange={setSearchValue}
                        placeholder={searchCountryPlaceholder}
                    />
                    {/* CommandList scrolls itself, which is also what cmdk keeps the active row inside. */}
                    <CommandList ref={listRef}>
                        <CommandEmpty>{noCountryFoundText}</CommandEmpty>
                        <CommandGroup>
                            {countries.map(({ country, label, callingCode }) => (
                                <CountrySelectOption
                                    key={country}
                                    country={country}
                                    countryName={label}
                                    callingCode={callingCode}
                                    selectedCountry={selectedCountry}
                                    onChange={onChange}
                                    onSelectComplete={() => setIsOpen(false)}
                                />
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

interface CountrySelectOptionProps extends RPNInput.FlagProps {
    callingCode: string;
    selectedCountry: RPNInput.Country | undefined;
    onChange: (country: RPNInput.Country) => void;
    onSelectComplete: () => void;
}

const CountrySelectOption = ({
                                 country,
                                 countryName,
                                 callingCode,
                                 selectedCountry,
                                 onChange,
                                 onSelectComplete,
                             }: CountrySelectOptionProps) => {
    const handleSelect = () => {
        onChange(country);
        onSelectComplete();
    };

    return (
        <CommandItem
            className="gap-2"
            // The row is addressed by country code, so the name and the dialling code have to be
            // spelled out as keywords for the search to reach them.
            value={country}
            keywords={[countryName, `+${callingCode}`, callingCode]}
            onSelect={handleSelect}
        >
            <FlagComponent country={country} countryName={countryName} />
            <span className="flex-1 text-sm">{countryName}</span>
            <span className="text-sm text-foreground/50">{`+${callingCode}`}</span>
            <CheckIcon
                className={cn(
                    "ml-auto size-4",
                    country === selectedCountry ? "opacity-100" : "opacity-0",
                )}
            />
        </CommandItem>
    );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
    const Flag = flags[country];

    return (
        <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
            {Flag && <Flag title={countryName} />}
        </span>
    );
};

export { PhoneInput };
