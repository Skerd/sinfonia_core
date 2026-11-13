import {render, screen} from "@testing-library/react";
import type {ReactNode} from "react";
import {describe, expect, it, vi} from "vitest";
import type {TableColumnConfig} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";
import {type CachedTableConfig, TableConfigContext} from "@coreModule/helpers/context/tableConfigContext.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import {toneClass, toneSwatchClass} from "@coreModule/components/entityPage/list/table/columnConfigToColumnDef.tsx";

/** A plan with a top-level status and an embedded installment list, the way the server builds its columns. */
const plans: CachedTableConfig = {
    filters: [],
    columns: [
        {id: "status", meta: {enumTones: {active: "success"}}},
        {id: "installments.status", meta: {enumTones: {paid: "success", overdue: "danger"}}},
    ] as unknown as TableColumnConfig[],
    columnVisibility: {},
};

function Provider({children}: {children: ReactNode}) {
    const value = {configs: {plans}, isHydrated: true, setConfig: vi.fn(), clearConfig: vi.fn(), updateColumnVisibility: vi.fn()};
    return <TableConfigContext.Provider value={value}>{children}</TableConfigContext.Provider>;
}

const badgeOf = (label: string) => screen.getByText(label).closest("[data-slot=badge]");

describe("StatusBadge", () => {
    it("paints a top-level status with the model's tone", () => {
        render(<StatusBadge tableConfigKey="plans" field="status" value="active" label="Active" />, {wrapper: Provider});
        expect(badgeOf("Active")?.className).toContain(toneClass("success"));
    });

    // TD-F72: installment rows kept their own colour map because only top-level fields were read.
    it("paints a status inside an embedded list from its dotted column", () => {
        render(<StatusBadge tableConfigKey="Plans" field="installments.status" value="overdue" label="Overdue" />, {wrapper: Provider});
        expect(badgeOf("Overdue")?.className).toContain(toneClass("danger"));
    });

    it("leaves a value without a tone plain and renders nothing without a value", () => {
        const {container} = render(
            <>
                <StatusBadge tableConfigKey="plans" field="installments.status" value="pending" label="Pending" />
                <StatusBadge tableConfigKey="plans" field="installments.status" value={undefined} label="None" />
            </>,
            {wrapper: Provider},
        );
        expect(badgeOf("Pending")?.className).not.toContain("text-success");
        expect(container.textContent).not.toContain("None");
    });
});

describe("toneSwatchClass", () => {
    it("fills a swatch per tone and keeps an untoned one faint", () => {
        expect(toneSwatchClass("success")).toBe("bg-success");
        expect(toneSwatchClass("danger")).toBe("bg-destructive");
        expect(toneSwatchClass(undefined)).toBe("bg-muted-foreground/20");
    });
});
