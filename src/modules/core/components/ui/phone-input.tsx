import * as React from "react";
import { IconSelector } from "@tabler/icons-react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { Button } from "@coreModule/components/ui/button.tsx";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@coreModule/components/ui/command.tsx";
import { Input } from "@coreModule/components/ui/input.tsx";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@coreModule/components/ui/popover.tsx";
import { ScrollArea } from "@coreModule/components/ui/scroll-area.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import useSelectedLanguage from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import type { LanguageDictionary } from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
const LANGUAGE_PATH = "src/modules/core/components/ui/phone-input.tsx";

type PhoneInputProps = Omit<
    React.ComponentProps<"input">,
    "onChange" | "value" | "ref"
> &
    Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
        onChange?: (value: RPNInput.Value) => void;
        searchPlaceholder?: string;
        noCountryFound?: string;
    };

const DEFAULTS = {
    searchPlaceholder: "Search country...",
    noCountryFound: "No country found.",
} as const;

function getString(lang: LanguageDictionary | null, key: string): string | undefined {
    if (!lang || typeof lang !== "object" || !(key in lang)) return undefined;
    const v = (lang as Record<string, unknown>)[key];
    return typeof v === "string" ? v : undefined;
}

const Flag = ({ country, countryName }: RPNInput.FlagProps) => {
    const FlagSvg = flags[country];
    return (
        <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
            {FlagSvg && <FlagSvg title={countryName} />}
        </span>
    );
};

type CountrySelectProps = {
    disabled?: boolean;
    value: RPNInput.Country;
    options: { label: string; value: RPNInput.Country | undefined }[];
    onChange: (country: RPNInput.Country) => void;
    searchPlaceholder?: string;
    noCountryFound?: string;
};

const CountrySelect = ({
    disabled,
    value: selectedCountry,
    options: countryList,
    onChange,
    searchPlaceholder = DEFAULTS.searchPlaceholder,
    noCountryFound = DEFAULTS.noCountryFound,
}: CountrySelectProps) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [search, setSearch] = React.useState("");
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
        viewport && (viewport.scrollTop = 0);
    }, [search]);

    return (
        <Popover
            open={open}
            modal
            onOpenChange={(o) => {
                setOpen(o);
                o && setSearch("");
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="default"
                    className={cn(
                        "h-8 min-w-0 shrink-0 gap-1 rounded-e-none rounded-s-lg border border-input border-r-0 bg-transparent px-2.5 font-normal shadow-none",
                        "text-foreground hover:bg-muted/50 dark:bg-input/30 dark:hover:bg-input/50",
                        "focus-visible:z-10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:disabled:bg-input/80"
                    )}
                    disabled={disabled}
                >
                    <Flag country={selectedCountry} countryName={selectedCountry} />
                    <IconSelector
                        className={cn(
                            "-mr-2 size-4 opacity-50",
                            !disabled && "opacity-100",
                            disabled && "hidden"
                        )}
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command value={selectedCountry}>
                    <CommandInput value={search} onValueChange={setSearch} placeholder={searchPlaceholder} />
                    <CommandList>
                        <ScrollArea ref={scrollRef} className="h-72">
                            <CommandEmpty>{noCountryFound}</CommandEmpty>
                            <CommandGroup>
                                {countryList.map(
                                    ({ value, label }) =>
                                        value && (
                                            <CommandItem
                                                key={value}
                                                value={value}
                                                className="gap-2"
                                                onSelect={() => {
                                                    onChange(value);
                                                    setOpen(false);
                                                }}
                                            >
                                                <Flag country={value} countryName={label} />
                                                <span className="flex-1 text-sm">{label}</span>
                                                <span className="text-sm text-foreground/50">+{RPNInput.getCountryCallingCode(value)}</span>
                                            </CommandItem>
                                        )
                                )}
                            </CommandGroup>
                        </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const PhoneInputInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, ...props }, ref) => (
        <Input
            className={cn("rounded-e-lg rounded-s-none border-l-0 focus-visible:z-10", className)}
            ref={ref}
            {...props}
        />
    )
);
PhoneInputInput.displayName = "PhoneInputInput";

const PhoneInput = React.forwardRef<
    React.ElementRef<typeof RPNInput.default>,
    PhoneInputProps
>(function PhoneInput(
    { className, onChange, value, searchPlaceholder, noCountryFound, ...props },
    ref
) {
    const { currentLanguage } = useSelectedLanguage<LanguageDictionary>(
        LANGUAGE_PATH.replace(/\//g, "_").replace(/\.(tsx|ts)$/, ""),
        LANGUAGE_PATH
    );

    const placeholder = searchPlaceholder ?? getString(currentLanguage ?? null, "searchCountry") ?? DEFAULTS.searchPlaceholder;
    const emptyText = noCountryFound ?? getString(currentLanguage ?? null, "noCountryFound") ?? DEFAULTS.noCountryFound;

    const countrySelect = React.useCallback(
        (csProps: Parameters<typeof CountrySelect>[0]) => (
            <CountrySelect {...csProps} searchPlaceholder={placeholder} noCountryFound={emptyText} />
        ),
        [placeholder, emptyText]
    );

    return (
        <RPNInput.default
            ref={ref}
            className={cn("flex w-full items-stretch", className)}
            flagComponent={Flag}
            countrySelectComponent={countrySelect}
            inputComponent={PhoneInputInput}
            smartCaret={false}
            value={value ?? ""}
            onChange={(v) => onChange?.(v ?? ("" as RPNInput.Value))}
            {...props}
        />
    );
});
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
