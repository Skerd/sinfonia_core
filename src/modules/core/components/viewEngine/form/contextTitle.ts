/**
 * Create forms opened on one record (a car, a unit) print that name in the heading.
 * The name starts in the URL, but the field can change, so the select writes the
 * chosen label here and the form shell reads it back on the next render.
 *
 * `formExtras.contextTitleField` is the form path. `formExtras.contextTitleLabels`
 * is a mutable id → label map seeded with the record the page opened on.
 */

export function contextTitleFieldName(formExtras: Record<string, unknown> | undefined): string | undefined {
    const field = formExtras?.contextTitleField;
    return typeof field === "string" && field !== "" ? field : undefined;
}

export function rememberContextTitle(
    formExtras: Record<string, unknown> | undefined,
    fieldName: string,
    value: string | string[],
    label?: string | string[],
): void {
    if (contextTitleFieldName(formExtras) !== fieldName) return;
    const labels = formExtras?.contextTitleLabels;
    if (labels == null || typeof labels !== "object" || Array.isArray(labels)) return;
    if (typeof value !== "string" || value === "" || typeof label !== "string" || label === "") return;
    Reflect.set(labels, value, label);
}

/** The heading context for the current field value. Empty when the field is blank or its label is not known yet. */
export function contextTitleItems(formExtras: Record<string, unknown> | undefined, fieldValue: unknown): string[] {
    const id = typeof fieldValue === "string" ? fieldValue : "";
    if (id === "") return [];
    const labels = formExtras?.contextTitleLabels;
    if (labels == null || typeof labels !== "object" || Array.isArray(labels)) return [];
    const label = Reflect.get(labels, id);
    return typeof label === "string" && label !== "" ? [label] : [];
}
