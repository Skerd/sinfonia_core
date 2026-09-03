import {useState} from "react";
import {IconInfoCircle} from "@tabler/icons-react";
import {Button} from "@coreModule/components/ui/button.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@coreModule/components/ui/sheet.tsx";

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
    resolveLanguageKey: (key: string) => unknown,
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

export function PageHelp({help}: {help: PageHelpContent}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <TooltipDisplayer tooltip={help.ariaLabel}>
                <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    aria-label={help.ariaLabel}
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    className="shrink-0 rounded-full border-border text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(true)}
                >
                    <IconInfoCircle className="size-3.5" stroke={1.5} />
                </Button>
            </TooltipDisplayer>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="w-full sm:max-w-2xl">
                    <SheetHeader className="pr-10">
                        <SheetTitle className="flex items-center gap-2">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                                <IconInfoCircle className="size-4" stroke={1.5} />
                            </span>
                            {help.title}
                        </SheetTitle>
                        <SheetDescription className="text-sm leading-relaxed text-foreground">
                            {help.overview}
                        </SheetDescription>
                    </SheetHeader>
                    {help.sections.length > 0 && (
                        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-6">
                            {help.sections.map((section) => (
                                <section key={section.title} className="flex flex-col gap-2">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {section.title}
                                    </h3>
                                    {section.body?.split("\n\n").map((paragraph) => (
                                        <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">
                                            {paragraph}
                                        </p>
                                    ))}
                                    {section.items.length > 0 && (
                                        <ul className="flex list-disc flex-col gap-2 pl-4 text-sm leading-relaxed text-muted-foreground">
                                            {section.items.map((item) => (
                                                <li key={item}>{item}</li>
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
