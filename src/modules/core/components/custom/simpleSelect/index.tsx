import { useCallback, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
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
import { ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@coreModule/components/lib/utils.ts';
import { CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import withLanguage, { WithLanguageType } from '@coreModule/helpers/hocs/withLanguage.tsx';
import { compose } from 'redux';
import SelectOptionLabel from '@coreModule/components/custom/selectOptionLabel.tsx';

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

const DEFAULT_FILTER: (option: SimpleSelectOption, searchText: string) => boolean = (option, searchText) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return (
        String(option.label ?? "").toLowerCase().includes(q) ||
        String(option.value ?? "").toLowerCase().includes(q)
    );
};

function stopCardActivation(event: MouseEvent | PointerEvent) {
    event.stopPropagation();
}

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
            setOpen(nextOpen);
        },
        [disabled],
    );

    const clearValue = useCallback(() => {
        if (disabled) return;
        if (multiple) {
            onValueChange?.([], []);
        } else {
            onValueChange?.('');
        }
        setSearchText('');
        setOpen(false);
    }, [disabled, multiple, onValueChange]);

    const handleClear = useCallback(
        (e: MouseEvent | PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            clearValue();
        },
        [clearValue],
    );

    const canClear = !disabled && (multiple ? selectedOptions.length > 0 : Boolean(selectedOption));

    const renderClearTriggerControl = () =>
        canClear ? (
            <span
                role="button"
                tabIndex={-1}
                aria-label={String(resolveLanguageKey('clear'))}
                className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onClick={handleClear}
            >
                <X className="h-3.5 w-3.5" />
            </span>
        ) : null;

    const renderOptionItem = useCallback(
        (option: SimpleSelectOption) => {
            const isSelected = selectedValuesSet.has(option.value);
            return (
                <CommandItem
                    key={option.value}
                    // cmdk collapses items that share a normalized value; prefix avoids bare "0".
                    value={`item:${option.value}`}
                    keywords={[option.label, option.value]}
                    className="flex min-w-0 gap-x-2"
                    aria-selected={multiple ? isSelected : undefined}
                    onSelect={() => handleOptionSelect(option)}
                >
                    {multiple ? (
                        <div
                            className={cn(
                                'border-primary flex size-4 shrink-0 items-center justify-center rounded-sm border',
                                isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                            )}
                        >
                            <CheckIcon className={cn('text-background h-4 w-4')} />
                        </div>
                    ) : (
                        <CheckIcon className={cn('text-primary h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                    )}
                    <SelectOptionLabel label={option.label} className="min-w-0 flex-1" />
                </CommandItem>
            );
        },
        [multiple, selectedValuesSet, handleOptionSelect],
    );

    const renderMultipleTriggerContent = () => {
        if (selectedOptions.length === 0) return effectivePlaceholder;
        if (selectedOptions.length <= 2) {
            const text = selectedOptions.map((o) => o.label).join(', ');
            return <SelectOptionLabel label={text} className="min-w-0 flex-1 text-left" />;
        }
        const text = `${selectedOptions.slice(0, 2).map((o) => o.label).join(', ')} +${selectedOptions.length - 2} ${String(resolveLanguageKey('more'))}`;
        return <SelectOptionLabel label={text} className="min-w-0 flex-1 text-left" />;
    };

    const renderSingleTriggerContent = () => {
        if (selectedOption) {
            return <SelectOptionLabel label={selectedOption.label} className="min-w-0 flex-1 text-left" />;
        }
        return effectivePlaceholder;
    };

    return (
        <div className={cn(!forTable && 'min-w-0 w-full max-w-full')}>
        <Popover modal open={open} onOpenChange={handleOpenChange}>
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
                        onClick={stopCardActivation}
                        onPointerDown={stopCardActivation}
                    >
                        <PlusCircledIcon className="size-4" />
                        {effectivePlaceholder}
                        {selectedValues.length > 0 && (
                            <>
                                <Separator orientation="vertical" className="mx-2 h-4" />
                                <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                    {selectedValues.length}
                                </Badge>
                                <div className="hidden gap-x-1 lg:flex">
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
                                {renderClearTriggerControl()}
                            </>
                        )}
                    </Button>
                ) : (
                        <Button
                            ref={triggerRef}
                            variant="outline"
                            role="combobox"
                            type="button"
                            aria-expanded={open}
                            aria-invalid={ariaInvalid}
                            disabled={disabled}
                            onClick={stopCardActivation}
                            onPointerDown={stopCardActivation}
                            className={cn(
                                // Override Button's shrink-0 / min-content so long labels truncate in the form grid.
                                'min-w-0 w-full max-w-full shrink overflow-hidden justify-between',
                                'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive',
                                {
                                    'text-muted-foreground': multiple ? selectedOptions.length === 0 : !selectedOption,
                                },
                                className,
                            )}
                        >
                            <span className="flex min-w-0 flex-1 overflow-hidden text-left">
                                {multiple ? renderMultipleTriggerContent() : renderSingleTriggerContent()}
                            </span>
                            <span className="ml-2 flex shrink-0 items-center gap-1">
                                {renderClearTriggerControl()}
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            </span>
                        </Button>
                )}
            </PopoverTrigger>
            <PopoverContent
                className={cn(
                    forTable
                        ? 'w-[200px] p-0'
                        : 'w-[var(--radix-popover-trigger-width)] min-w-[var(--radix-popover-trigger-width)] max-w-[min(90vw,32rem)] p-0',
                    'flex max-h-[min(24rem,var(--radix-popover-content-available-height))] flex-col overflow-hidden',
                )}
                align="start"
                collisionPadding={8}
                container={drawerPortalContainer?.current ?? undefined}
                onWheel={(event) => event.stopPropagation()}
                onTouchMove={(event) => event.stopPropagation()}
                onCloseAutoFocus={(event) => event.preventDefault()}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
            >
                <Command className="flex h-auto min-h-0 w-full min-w-0 flex-col overflow-hidden" shouldFilter={false}>
                    <div className="relative">
                        <CommandInput
                            placeholder={String(searchPlaceholder ?? resolveLanguageKey('searchPlaceholder'))}
                            value={searchText}
                            onValueChange={setSearchText}
                        />
                        {selectedOptions.length > 0 && !forTable && (
                            <div className="absolute top-0 right-2">
                                <Button
                                    variant="ghost"
                                    type="button"
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                    onClick={clearValue}
                                >
                                    {String(resolveLanguageKey('clear'))}
                                </Button>
                            </div>
                        )}
                    </div>

                    <CommandList
                        aria-multiselectable={multiple}
                        className="min-h-0 max-h-[min(20rem,calc(var(--radix-popover-content-available-height,20rem)-2.75rem))] overflow-y-auto overscroll-contain"
                    >
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
                                                onSelect={clearValue}
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
        </div>
    );
}

export const SimpleSelect = compose(
    withLanguage("src/modules/core/components/custom/simpleSelect/index.tsx"),
)(SimpleSelectRender);
