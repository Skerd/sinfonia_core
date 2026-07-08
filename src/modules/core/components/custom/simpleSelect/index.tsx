import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '@coreModule/components/ui/button.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@coreModule/components/ui/popover.tsx';
import { useDrawerPortalContainer } from '@coreModule/components/ui/drawer.tsx';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@coreModule/components/ui/command.tsx';
import { Badge } from '@coreModule/components/ui/badge.tsx';
import { Separator } from '@coreModule/components/ui/separator.tsx';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@coreModule/components/lib/utils.ts';
import { CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import withLanguage, { WithLanguageType } from '@coreModule/helpers/hocs/withLanguage.tsx';
import { compose } from 'redux';

export type SimpleSelectOption = {
    label: string;
    value: string;
};

type SimpleSelectProps = WithLanguageType & {
    options: SimpleSelectOption[];
    value?: string | string[]; /** Single: string. Multiple: string[]. */
    onValueChange?: (value: string | string[], label?: string | string[]) => void; /** When true, value/onValueChange use string[] and user can select multiple. */
    multiple?: boolean;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    'aria-invalid'?: boolean;
    forTable?: boolean;
    /** Optional: custom filter function. Defaults to case-insensitive label contains search. */
    filterOption?: (option: SimpleSelectOption, searchText: string) => boolean;
    searchPlaceholder?: string;
};

const DEFAULT_FILTER: (option: SimpleSelectOption, searchText: string) => boolean = (option, searchText) =>
    option.label.toLowerCase().includes(searchText.trim().toLowerCase());

function SimpleSelectRender({
    options,
    value,
    onValueChange,
    multiple = false,
    placeholder,
    disabled = false,
    className,
    'aria-invalid': ariaInvalid,
    resolveLanguageKey,
    forTable = false,
    filterOption = DEFAULT_FILTER,
    searchPlaceholder,
}: SimpleSelectProps) {
    const selectedValues: string[] = useMemo(
        () =>
            multiple
                ? (Array.isArray(value) ? value : value != null ? [value] : [])
                : value != null && !Array.isArray(value)
                  ? [value]
                  : [],
        [multiple, value],
    );

    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [popoverWidth, setPopoverWidth] = useState<number | undefined>();
    const triggerRef = useRef<HTMLButtonElement>(null);

    const searchLower = useMemo(() => searchText.trim().toLowerCase(), [searchText]);

    const filteredOptions = useMemo(() => {
        if (!searchLower) return options;
        return options.filter((opt) => (filterOption ?? DEFAULT_FILTER)(opt, searchText));
    }, [options, searchLower, searchText, filterOption]);

    const selectedValuesSet = useMemo(() => new Set(selectedValues), [selectedValues]);

    const selectedOptions = useMemo(
        () => options.filter((opt) => selectedValuesSet.has(opt.value)),
        [options, selectedValuesSet],
    );

    const selectedOption = !multiple ? selectedOptions[0] : undefined;
    const effectivePlaceholder = placeholder ?? String(resolveLanguageKey('selectPlaceholder'));
    const drawerPortalContainer = useDrawerPortalContainer();

    const handleOptionSelect = useCallback(
        (option: SimpleSelectOption) => {
            if (multiple) {
                const isSelected = selectedValuesSet.has(option.value);
                const nextValues = isSelected
                    ? selectedValues.filter((v) => v !== option.value)
                    : [...selectedValues, option.value];
                const nextOptions = nextValues
                    .map((v) => options.find((o) => o.value === v))
                    .filter(Boolean) as SimpleSelectOption[];
                const nextLabels = nextOptions.map((o) => o.label);
                onValueChange?.(nextValues, nextLabels);
            } else {
                onValueChange?.(option.value, option.label);
                setOpen(false);
            }
        },
        [multiple, selectedValues, selectedValuesSet, options, onValueChange],
    );

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (disabled) return;
            if (!nextOpen) setSearchText('');
            else if (triggerRef.current) setPopoverWidth(triggerRef.current.offsetWidth);
            setOpen(nextOpen);
        },
        [disabled],
    );

    const renderOptionItem = useCallback(
        (option: SimpleSelectOption) => {
            const isSelected = selectedValuesSet.has(option.value);
            return (
                <CommandItem
                    key={option.value}
                    value={option.value}
                    className="space-x-0"
                    aria-selected={multiple ? isSelected : undefined}
                    onSelect={() => handleOptionSelect(option)}
                >
                    {multiple ? (
                        <div
                            className={cn(
                                'border-primary flex size-4 items-center justify-center rounded-sm border',
                                isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                            )}
                        >
                            <CheckIcon className={cn('text-background h-4 w-4')} />
                        </div>
                    ) : (
                        <CheckIcon className={cn('text-primary h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                    )}
                    <p>{option.label}</p>
                </CommandItem>
            );
        },
        [multiple, selectedValuesSet, handleOptionSelect],
    );

    const renderMultipleTriggerContent = () => {
        if (selectedOptions.length === 0) return effectivePlaceholder;
        if (selectedOptions.length <= 2) {
            return selectedOptions.map((o) => o.label).join(', ');
        }
        return `${selectedOptions.slice(0, 2).map((o) => o.label).join(', ')} +${selectedOptions.length - 2} ${String(resolveLanguageKey('more'))}`;
    };

    const renderSingleTriggerContent = () => {
        if (selectedOption) return selectedOption.label;
        return effectivePlaceholder;
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild disabled={disabled}>
                {forTable ? (
                    <Button
                        ref={triggerRef}
                        variant="outline"
                        size="sm"
                        type="button"
                        className={cn('h-8 border-dashed', className)}
                        role="combobox"
                        aria-expanded={open}
                        aria-invalid={ariaInvalid}
                        disabled={disabled}
                    >
                        <PlusCircledIcon className="size-4" />
                        {effectivePlaceholder}
                        {selectedValues.length > 0 && (
                            <>
                                <Separator orientation="vertical" className="mx-2 h-4" />
                                <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                    {selectedValues.length}
                                </Badge>
                                <div className="hidden space-x-1 lg:flex">
                                    {selectedValues.length > 2 ? (
                                        <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                            {selectedValues.length} {String(resolveLanguageKey('selected'))}
                                        </Badge>
                                    ) : (
                                        selectedOptions.map((opt) => (
                                            <Badge
                                                variant="secondary"
                                                key={opt.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {opt.label}
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </Button>
                ) : (
                    <div className="w-full">
                        <Button
                            ref={triggerRef}
                            variant="outline"
                            role="combobox"
                            type="button"
                            aria-expanded={open}
                            aria-invalid={ariaInvalid}
                            disabled={disabled}
                            className={cn(
                                'w-full justify-between',
                                'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive',
                                {
                                    'text-muted-foreground': multiple ? selectedOptions.length === 0 : !selectedOption,
                                },
                                className,
                            )}
                        >
                            {multiple ? renderMultipleTriggerContent() : renderSingleTriggerContent()}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </div>
                )}
            </PopoverTrigger>
            <PopoverContent
                className={cn(forTable ? 'w-[200px] p-0' : 'w-full p-0')}
                style={forTable ? undefined : { width: popoverWidth }}
                align="start"
                container={drawerPortalContainer?.current ?? undefined}
            >
                <Command className="w-full" shouldFilter={false}>
                    <div className="relative">
                        <CommandInput
                            placeholder={String(searchPlaceholder ?? resolveLanguageKey('searchPlaceholder'))}
                            value={searchText}
                            onValueChange={setSearchText}
                        />
                        {multiple && selectedOptions.length > 0 && !forTable && (
                            <div className="absolute top-0 right-2">
                                <Button
                                    variant="ghost"
                                    type="button"
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                        onValueChange?.([], []);
                                        setSearchText('');
                                    }}
                                >
                                    {String(resolveLanguageKey('clear'))}
                                </Button>
                            </div>
                        )}
                    </div>

                    <CommandList aria-multiselectable={multiple}>
                        {
                            filteredOptions.length === 0 ?
                            <div className="flex p-3 items-center justify-center w-full rounded-lg">
                                <CommandEmpty>{String(resolveLanguageKey('noResults'))}</CommandEmpty>
                            </div>
                            :
                            <>
                                <CommandGroup>
                                    {filteredOptions.map(renderOptionItem)}
                                </CommandGroup>
                                {
                                    forTable && selectedValues.length > 0 &&
                                    <>
                                        <CommandSeparator />
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => {
                                                    onValueChange?.([], []);
                                                    setOpen(false);
                                                }}
                                                className="justify-center text-center"
                                            >
                                                {String(resolveLanguageKey('clear'))}
                                            </CommandItem>
                                        </CommandGroup>
                                    </>
                                }
                            </>
                        }
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export const SimpleSelect = compose(
    withLanguage("src/modules/core/components/custom/simpleSelect/index.tsx"),
)(SimpleSelectRender);
