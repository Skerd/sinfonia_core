import {afterEach, describe, expect, it, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import {DetailFacts, DetailSpecs} from "../detailPage.tsx";

const Icon = () => <svg />;

describe("DetailFacts and DetailSpecs", () => {
    afterEach(() => vi.restoreAllMocks());

    // Callers pass translated labels, which all read "" until the caller's dictionary has loaded.
    it("renders every item without duplicate keys while the labels are still blank", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

        render(
            <>
                <DetailFacts facts={[{icon: Icon, label: "", value: "8"}, {icon: Icon, label: "", value: "5"}, {icon: Icon, label: "", value: "6"}]} />
                <DetailSpecs rows={[{label: "", value: "Automatic"}, {label: "", value: "Diesel"}]} />
            </>,
        );

        expect(screen.getByText("8")).toBeTruthy();
        expect(screen.getByText("6")).toBeTruthy();
        expect(screen.getByText("Diesel")).toBeTruthy();
        const duplicateKeyWarnings = consoleError.mock.calls.filter((call) => String(call[0]).includes("same key"));
        expect(duplicateKeyWarnings).toHaveLength(0);
    });
});
