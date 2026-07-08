import { useFormContext, useWatch } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@coreModule/components/ui/tabs.tsx";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import type { ViewNode } from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import FormRepeater, { type RowCascade } from "./formRepeater.tsx";

export type FormTabbedRepeaterTab = {
    key: string;
    label: string;
};

export type FormTabbedRepeaterProps = {
    resolveLanguageKey: ResolveLanguageKey;
    loading?: boolean;
    disabled?: boolean;
    editMode?: boolean;
    writeAccess?: Record<string, any>;
    formExtras?: Record<string, unknown>;
    /** Parent field path, e.g. "findings". Each tab's array lives at `{fieldPrefix}.{tab.key}`. */
    fieldPrefix: string;
    tabs: FormTabbedRepeaterTab[];
    defaultItem: Record<string, unknown>;
    rowTemplate: ViewNode[];
    rowCascades?: RowCascade[];
    rowTitleFields?: string[];
    rowTitleSeparator?: string;
    rowTitlePlaceholder?: string;
    addLabel?: string;
    removeLabel?: string;
};

export default function FormTabbedRepeater({
    resolveLanguageKey,
    loading = false,
    disabled,
    editMode = false,
    writeAccess,
    formExtras,
    fieldPrefix,
    tabs,
    defaultItem = {},
    rowTemplate = [],
    rowCascades,
    rowTitleFields,
    rowTitleSeparator,
    rowTitlePlaceholder,
    addLabel,
    removeLabel,
}: FormTabbedRepeaterProps) {
    const form = useFormContext();
    const watchedArrays = useWatch({
        control: form.control,
        name: tabs.map((t) => `${fieldPrefix}.${t.key}`) as any[],
    });

    const counts = tabs.map((_, i) => {
        const arr = Array.isArray(watchedArrays) ? watchedArrays[i] : undefined;
        return Array.isArray(arr) ? arr.length : 0;
    });

    if (tabs.length === 0) return null;

    return (
        <Tabs defaultValue={tabs[0].key} orientation="horizontal" className="space-y-0">
            <div className="relative mb-1 h-10 overflow-x-auto rounded-sm bg-muted">
                <TabsList className="absolute mb-0 flex w-full flex-row justify-stretch pb-0 pt-1">
                    {tabs.map((tab, i) => (
                        <TabsTrigger key={tab.key} value={tab.key} className="hover:cursor-pointer gap-1">
                            <span className="truncate">{String(resolveLanguageKey(tab.label))}</span>
                            <span
                                className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 px-1 py-px text-[10px] font-semibold tabular-nums text-foreground/80"
                                aria-hidden
                            >
                                {counts[i]}
                            </span>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
            {tabs.map((tab, i) => (
                <TabsContent
                    key={tab.key}
                    value={tab.key}
                    className={i === 0 ? "mt-0 outline-none" : "outline-none"}
                >
                    <FormRepeater
                        resolveLanguageKey={resolveLanguageKey}
                        loading={loading}
                        disabled={disabled}
                        editMode={editMode}
                        writeAccess={writeAccess}
                        formExtras={formExtras}
                        arrayField={`${fieldPrefix}.${tab.key}`}
                        defaultItem={defaultItem}
                        rowTemplate={rowTemplate}
                        rowCascades={rowCascades}
                        rowTitleFields={rowTitleFields}
                        rowTitleSeparator={rowTitleSeparator}
                        rowTitlePlaceholder={rowTitlePlaceholder}
                        addLabel={addLabel}
                        removeLabel={removeLabel}
                    />
                </TabsContent>
            ))}
        </Tabs>
    );
}
