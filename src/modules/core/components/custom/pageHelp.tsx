import {useLayoutEffect, useRef, useState} from "react";
import {IconInfoCircle} from "@tabler/icons-react";
import {Button} from "@coreModule/components/ui/button.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@coreModule/components/ui/sheet.tsx";
import {FLOATING_SHEET_CONTENT_CLASS} from "@coreModule/components/viewEngine/sheet/widgets/sheetFloatingChrome.ts";
import {cn} from "@coreModule/components/lib/utils.ts";

export type PageHelpSection = {
    title: string;
    body?: string;
    items: string[];
};

export type PageHelpContent = {
    ariaLabel: string;
    title: string;
    overview: string;
    sections: PageHelpSection[];
};

const LEGACY_SECTION_KEYS = [
    ["thisPageTitle", "thisPage"],
    ["behaviorTitle", "behavior"],
    ["relatedTitle", "related"],
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return value != null && typeof value === "object" && !Array.isArray(value);
}

function readTrimmedString(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

function readItems(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value.flatMap((entry) => {
        const text = readTrimmedString(entry);
        return text ? [text] : [];
    });
}

function parseSection(value: unknown): PageHelpSection | undefined {
    if (!isRecord(value)) return undefined;
    const title = readTrimmedString(value.title);
    if (!title) return undefined;
    const body = readTrimmedString(value.body) || undefined;
    const items = readItems(value.items);
    if (!body && items.length === 0) return undefined;
    return {title, body, items};
}

/**
 * Reads optional help from the current page dictionary.
 * Missing object / `overview` means the header icon is not shown.
 */
export function readPageHelp(
    resolveLanguageKey: ResolveLanguageKey,
    languageKey = "help",
): PageHelpContent | undefined {
    const raw = resolveLanguageKey(languageKey);
    if (!isRecord(raw)) return undefined;
    const overview = readTrimmedString(raw.overview);
    if (!overview) return undefined;

    const title = readTrimmedString(raw.title) || overview;
    const ariaLabel = readTrimmedString(raw.ariaLabel) || title;
    const fromArray = Array.isArray(raw.sections)
        ? raw.sections.flatMap((section) => {
            const parsed = parseSection(section);
            return parsed ? [parsed] : [];
        })
        : [];
    const fromLegacy = fromArray.length > 0
        ? []
        : LEGACY_SECTION_KEYS.flatMap(([titleKey, bodyKey]) => {
            const sectionTitle = readTrimmedString(raw[titleKey]);
            const body = readTrimmedString(raw[bodyKey]);
            return sectionTitle && body ? [{title: sectionTitle, body, items: []}] : [];
        });

    return {ariaLabel, title, overview, sections: fromArray.length > 0 ? fromArray : fromLegacy};
}

/** The help each ⓘ control opens, so the guided tour can explain a page with it (D180). */
const helpByControl = new WeakMap<Element, PageHelpContent>();

/** The help that the ⓘ control `control` opens, if it is one. */
export function pageHelpOf(control: Element): PageHelpContent | undefined {
    return helpByControl.get(control);
}

export function PageHelp({help}: {help: PageHelpContent}) {
    const [open, setOpen] = useState(false);
    const control = useRef<HTMLButtonElement>(null);
    // On every change: a page can keep its ⓘ control while its help changes (another list on the same page component).
    useLayoutEffect(() => {
        if (control.current) helpByControl.set(control.current, help);
    }, [help]);

    return (
        <>
            <TooltipDisplayer tooltip={help.ariaLabel}>
                <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    aria-label={help.ariaLabel}
                    data-tour="page.help"
                    ref={control}
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    className="shrink-0 rounded-full border-border text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(true)}
                >
                    <IconInfoCircle className="size-5"  />
                </Button>
            </TooltipDisplayer>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className={cn("w-full sm:max-w-2xl", FLOATING_SHEET_CONTENT_CLASS)}>
                    <SheetHeader className="pr-4 p-4">
                        <SheetTitle className="flex items-center gap-2">
                            {help.title}
                        </SheetTitle>
                        <SheetDescription className="text-sm leading-relaxed text-foreground">
                            {help.overview}
                        </SheetDescription>
                    </SheetHeader>
                    {help.sections.length > 0 && (
                        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-6">
                            {help.sections.map((section, sectionIndex) => (
                                <section key={sectionIndex} className="flex flex-col gap-2">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {section.title}
                                    </h3>
                                    {section.body?.split("\n\n").map((paragraph, paragraphIndex) => (
                                        <p key={paragraphIndex} className="text-sm leading-relaxed text-muted-foreground">
                                            {paragraph}
                                        </p>
                                    ))}
                                    {section.items.length > 0 && (
                                        <ul className="flex list-disc flex-col gap-2 pl-4 text-sm leading-relaxed text-muted-foreground">
                                            {section.items.map((item, itemIndex) => (
                                                <li key={itemIndex}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            ))}
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
