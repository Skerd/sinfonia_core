/**
 * `DisplayRow` is the heaviest component in a card body — a unit card renders eleven of them,
 * so ~220 instances on a 20-card page — and it was untested.
 *
 * `DisplayValue` is deliberately NOT mocked here: half the point is that the truncation tooltip
 * and the visible cell agree, which can only be checked against the real formatter.
 */
import {describe, expect, it, vi} from "vitest";
import {screen} from "@testing-library/react";

vi.mock("@baseModule/helpers/hocs/withLanguage.tsx", async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    default: (await import("./probes.tsx")).fakeWithLanguage,
}));

const {EntityCardRow: DisplayRow} = await import("@baseModule/components/entityPage/list/card/EntityCardRow");
const {displayPlainText} = await import(
    "@baseModule/components/viewEngine/widgets/display/displayValue.tsx"
);
const {InfoRowGroup} = await import("@coreModule/components/customUnchecked/infoRowGroup.tsx");
const {default: AccessFields} = await import(
    "@baseModule/components/viewEngine/widgets/display/accessFields.tsx"
);
const {renderWithCardEnv, resetCalls} = await import("./harness.tsx");

/** Loosely typed on purpose: each test spells out only the props it exercises. */
function row(props: Record<string, unknown>, read: unknown = true) {
    resetCalls();
    const rowProps = {label: "Label", ...props} as any;
    return renderWithCardEnv(
        <AccessFields read={read}>
            <InfoRowGroup>
                <EntityCardRow {...rowProps} />
            </InfoRowGroup>
        </AccessFields>,
    );
}

describe("DisplayRow access gating", () => {
    it("renders a row whose path the read map grants", () => {
        row({path: "slug", value: "alpha"}, {slug: {}});
        expect(screen.getByText("alpha")).toBeInTheDocument();
    });

    it("omits a row whose path the read map denies", () => {
        row({path: "slug", value: "alpha"}, {other: {}});
        expect(screen.queryByText("alpha")).not.toBeInTheDocument();
    });

    it("lets an explicit show prop win over the path", () => {
        row({path: "slug", value: "alpha", show: true}, {other: {}});
        expect(screen.getByText("alpha")).toBeInTheDocument();
    });

    it("hides the row when show is false even for a granted path", () => {
        row({path: "slug", value: "alpha", show: false}, {slug: {}});
        expect(screen.queryByText("alpha")).not.toBeInTheDocument();
    });

    /* Computed aggregates are not model ACL keys — the backend decides the payload. */
    it("always renders statistics paths", () => {
        row({path: "statistics.totalUnits", value: 7}, {other: {}});
        expect(screen.getByText("7")).toBeInTheDocument();
    });

    it("renders a row with no path at all", () => {
        row({value: "alpha"});
        expect(screen.getByText("alpha")).toBeInTheDocument();
    });
});

describe("DisplayRow inside InfoRowGroup", () => {
    it("reports a denied row to the group instead of rendering a padlock per field", () => {
        row({path: "slug", value: "alpha", label: "Slug"}, {other: {}});
        /* The group renders one aggregate notice; the row itself is gone. */
        expect(screen.queryByText("alpha")).not.toBeInTheDocument();
        expect(document.querySelector("[data-slot=restricted-fields]")).not.toBeNull();
    });

    it("renders no restriction notice when every row is readable", () => {
        row({path: "slug", value: "alpha"}, {slug: {}});
        expect(document.querySelector("[data-slot=restricted-fields]")).toBeNull();
    });
});

/*
 * D1 regression, asserted on the formatter rather than the DOM: jsdom has no layout, so
 * `TruncatedValue` never measures an overflow and the tooltip text never reaches the document.
 * The invariant that matters is that the text handed to the tooltip is the text the cell shows.
 */
describe("displayPlainText matches what DisplayValue renders", () => {
    function cellText(value: unknown, type: string) {
        row({value, type, path: "f"}, true);
        const cell = document.querySelector(".min-w-0.hover\\:cursor-default");
        return cell?.textContent ?? "";
    }

    it("groups currency digits exactly like the cell", () => {
        const value = {amount: 1234.5, currency: {symbol: "€", abbreviation: "EUR"}};
        expect(displayPlainText(value, "currency")).toBe(cellText(value, "currency"));
        /* The old tooltip formatter used toFixed(2), which drops the grouping separator. */
        expect(displayPlainText(value, "currency")).toContain("1,234.50");
    });

    it("groups plain numbers exactly like the cell", () => {
        expect(displayPlainText(1234567, "number")).toBe(cellText(1234567, "number"));
    });

    it("formats a date-only string exactly like the cell", () => {
        expect(displayPlainText("2026-03-04", "date", {timeZone: "UTC"})).toBe(
            cellText("2026-03-04", "date"),
        );
    });

    it("joins a user stub exactly like the cell", () => {
        const value = {name: "Ada", surname: "Lovelace"};
        expect(displayPlainText(value, "user")).toBe(cellText(value, "user"));
    });

    it("returns empty text for values that render as an element", () => {
        expect(displayPlainText({id: "m1"}, "media")).toBe("");
        expect(displayPlainText("gb", "flag")).toBe("");
    });

    it("returns empty text for an absent value", () => {
        expect(displayPlainText(null, "currency")).toBe("");
        expect(displayPlainText("", "string")).toBe("");
    });
});
