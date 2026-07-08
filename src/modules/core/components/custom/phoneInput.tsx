import * as React from "react";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@coreModule/components/ui/command.tsx";
import {ScrollArea} from "@coreModule/components/ui/scroll-area.tsx";
import useSelectedLanguage, { LanguageDictionary } from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
const LANGUAGE_PATH = "src/modules/core/components/custom/phoneInput.tsx";
const DEFAULT_TEXT = {
    searchCountry: "Search country...",
    noCountryFound: "No country found.",
} as const;

function getLanguageText(currentLanguage: LanguageDictionary | null, key: keyof typeof DEFAULT_TEXT): string {
    if (!currentLanguage || typeof currentLanguage !== "object") return DEFAULT_TEXT[key];
    const value = (currentLanguage as Record<string, unknown>)[key];
    return typeof value === "string" ? value : DEFAULT_TEXT[key];
}

type PhoneInputProps = Omit<
    React.ComponentProps<"input">,
    "onChange" | "value" | "ref"
> &
    Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void;
};

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
    React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
        ({ className, onChange, value, ...props }, ref) => {
            const { currentLanguage } = useSelectedLanguage<LanguageDictionary>(
                LANGUAGE_PATH.replace(/\//g, "_").replace(/\.(tsx|ts)$/, ""),
                LANGUAGE_PATH
            );

            const searchCountryPlaceholder = getLanguageText(currentLanguage, "searchCountry");
            const noCountryFoundText = getLanguageText(currentLanguage, "noCountryFound");

            const countrySelect = React.useCallback(
                (countrySelectProps: CountrySelectProps) => (
                    <CountrySelect
                        {...countrySelectProps}
                        searchCountryPlaceholder={searchCountryPlaceholder}
                        noCountryFoundText={noCountryFoundText}
                    />
                ),
                [searchCountryPlaceholder, noCountryFoundText]
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
                     *
                     * @param {E164Number | undefined} value - The entered value
                     */
                    onChange={(value) => onChange?.(value || ("" as RPNInput.Value))}
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
    value: RPNInput.Country;
    options: CountryEntry[];
    onChange: (country: RPNInput.Country) => void;
    searchCountryPlaceholder?: string;
    noCountryFoundText?: string;
};

const CountrySelect = ({
                           disabled,
                           value: selectedCountry,
                           options: countryList,
                           onChange,
                           searchCountryPlaceholder = DEFAULT_TEXT.searchCountry,
                           noCountryFoundText = DEFAULT_TEXT.noCountryFound,
                       }: CountrySelectProps) => {
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const [searchValue, setSearchValue] = React.useState("");
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <Popover
            open={isOpen}
            modal
            onOpenChange={(open: boolean) => {
                setIsOpen(open);
                open && setSearchValue("");
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="flex gap-1 rounded-e-none rounded-s-lg border-r-0 px-3 focus:z-10"
                    disabled={disabled}
                >
                    <FlagComponent
                        country={selectedCountry}
                        countryName={selectedCountry}
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
                <Command>
                    <CommandInput
                        value={searchValue}
                        onValueChange={(value: string) => {
                            setSearchValue(value);
                            setTimeout(() => {
                                if (scrollAreaRef.current) {
                                    const viewportElement = scrollAreaRef.current.querySelector(
                                        "[data-radix-scroll-area-viewport]",
                                    );
                                    if (viewportElement) {
                                        viewportElement.scrollTop = 0;
                                    }
                                }
                            }, 0);
                        }}
                        placeholder={searchCountryPlaceholder}
                    />
                    <CommandList>
                        <ScrollArea ref={scrollAreaRef} className="h-72">
                            <CommandEmpty>{noCountryFoundText}</CommandEmpty>
                            <CommandGroup>
                                {countryList.map(({ value, label }) =>
                                    value ? (
                                        <CountrySelectOption
                                            key={value}
                                            country={value}
                                            countryName={label}
                                            selectedCountry={selectedCountry}
                                            onChange={onChange}
                                            onSelectComplete={() => setIsOpen(false)}
                                        />
                                    ) : null,
                                )}
                            </CommandGroup>
                        </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

interface CountrySelectOptionProps extends RPNInput.FlagProps {
    selectedCountry: RPNInput.Country;
    onChange: (country: RPNInput.Country) => void;
    onSelectComplete: () => void;
}

const CountrySelectOption = ({
                                 country,
                                 countryName,
                                 selectedCountry,
                                 onChange,
                                 onSelectComplete,
                             }: CountrySelectOptionProps) => {
    const handleSelect = () => {
        onChange(country);
        onSelectComplete();
    };

    return (
        <CommandItem className="gap-2" onSelect={handleSelect}>
            <FlagComponent country={country} countryName={countryName} />
            <span className="flex-1 text-sm">{countryName}</span>
            <span className="text-sm text-foreground/50">{`+${RPNInput.getCountryCallingCode(country)}`}</span>
            <CheckIcon
                className={`ml-auto size-4 ${country === selectedCountry ? "opacity-100" : "opacity-0"}`}
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
