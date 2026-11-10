/**
 * Fills `{name}` placeholders in translated text with `values`. A placeholder without a value stays as written, so a
 * missing value is visible rather than silently dropped.
 *
 * @example fillTemplate("Unit {unit} sold", {unit: "A-101"}) // "Unit A-101 sold"
 */
export function fillTemplate(template: string, values: Readonly<Record<string, string | number>>): string {
    return template.replace(/\{(\w+)\}/g, (whole, key: string) => {
        const value = values[key];
        return value == null ? whole : String(value);
    });
}
