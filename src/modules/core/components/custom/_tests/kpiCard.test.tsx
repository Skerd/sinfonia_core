import {act, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import {IconCoin} from "@tabler/icons-react";
import {KpiCard, type KpiCardProps} from "../kpiCard.tsx";
import {TooltipProvider} from "@coreModule/components/ui/tooltip.tsx";

afterEach(() => vi.useRealTimers());

describe("KpiCard shortened figure", () => {
    it("reads the exact figure to screen readers in place of the short one", () => {
        render(<KpiCard compact title="Revenue" value="€ 1.8M" fullValue="€ 1,842,361.76" icon={IconCoin}/>);

        expect(screen.getByText("€ 1.8M").getAttribute("aria-hidden")).toBe("true");
        expect(screen.getByText("€ 1,842,361.76").className).toContain("sr-only");
    });

    it("shows the exact figure when the card is hovered", () => {
        vi.useFakeTimers();
        render(
            <TooltipProvider>
                <KpiCard compact title="Revenue" value="€ 1.8M" fullValue="€ 1,842,361.76" icon={IconCoin}/>
            </TooltipProvider>,
        );
        const card = screen.getByRole("region", {name: "Revenue"});
        fireEvent.pointerMove(card, {pointerType: "mouse"});
        fireEvent.mouseEnter(card);
        act(() => vi.advanceTimersByTime(2_000));

        expect(screen.getAllByText("€ 1,842,361.76").length).toBeGreaterThan(1);
    });

    it("adds nothing when the figure is already exact", () => {
        render(<KpiCard compact title="Units" value="246" fullValue="246" icon={IconCoin}/>);

        expect(screen.getAllByText("246")).toHaveLength(1);
        expect(screen.getByText("246").getAttribute("aria-hidden")).toBeNull();
    });
});

const TINTED: NonNullable<KpiCardProps["variant"]>[] = ["primary", "success", "warning", "danger"];
const ICON_TONE: Record<NonNullable<KpiCardProps["variant"]>, string> = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
};

describe("KpiCard tint", () => {
    // Many tiles to a row each with a pastel fill and coloured ring read as decoration: a compact tile keeps the card
    // surface and shows its variant on the icon.
    it.each(TINTED)("keeps a compact %s tile on the card surface and colours only its icon", (variant) => {
        render(<KpiCard compact title={`Compact ${variant}`} value="1" icon={IconCoin} variant={variant}/>);
        const card = screen.getByRole("region", {name: `Compact ${variant}`});

        expect(card.className).toMatch(/\bbg-card\b/);
        expect(card.className).not.toContain("color-mix");
        expect(card.querySelector("svg")?.parentElement?.className).toContain(ICON_TONE[variant]);
    });

    // A tint laid over nothing (`bg-primary/5`) replaced the card colour, so on a gray panel a tinted card turned gray
    // while its plain neighbours stayed solid. The full-size card mixes its tint into the card colour instead.
    it.each(TINTED)("keeps a full-size %s card solid on any surface", (variant) => {
        render(<KpiCard title={`Full ${variant}`} value="1" icon={IconCoin} variant={variant}/>);
        const card = screen.getByRole("region", {name: `Full ${variant}`});

        expect(card.className).not.toMatch(/\bbg-(primary|success|warning|destructive)\/\d+/);
        expect(card.className).toContain("var(--color-card)");
    });
});
