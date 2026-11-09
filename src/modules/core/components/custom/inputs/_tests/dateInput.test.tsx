import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {
    DateInput,
    formatIncludesSeconds,
    formatIncludesTime,
} from "@coreModule/components/custom/inputs/dateInput.tsx";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";

// The component only needs labels from the dictionary loader, and that loader pulls in the redux
// store; the test supplies the dictionary directly instead.
vi.mock("@coreModule/helpers/hooks/useSelectedLanguage.ts", () => ({
    default: () => ({currentLanguage: {clear: "Clear", hourLabel: "Hr", minuteLabel: "Min"}}),
}));

const dateBox = () => screen.getByRole("textbox") as HTMLInputElement;

describe("format token detection", () => {
    it.each([
        ["HH:mm", true],
        ["YYYY-MM-DD HH:mm", true],
        ["YYYY-MM-DD[T]HH:mm:ss", true],
        ["hh:mm a", true],
        ["YYYY-MM-DD", false],
        ["DD.MM.YYYY", false],
        // The escaped literal must not be mistaken for an hour/minute token.
        ["YYYY-MM-DD[T00:00]", false],
    ])("formatIncludesTime(%s) === %s", (pattern, expected) => {
        expect(formatIncludesTime(pattern)).toBe(expected);
    });

    it("detects seconds only when the pattern carries them", () => {
        expect(formatIncludesSeconds("HH:mm:ss")).toBe(true);
        expect(formatIncludesSeconds("HH:mm")).toBe(false);
    });
});

describe("DateInput value handling", () => {
    it("shows a value that matches its valueFormat", () => {
        render(<DateInput valueFormat="YYYY-MM-DD" displayFormat="DD.MM.YYYY" value="2026-03-15"/>);
        expect(dateBox().value).toBe("15.03.2026");
    });

    /**
     * Stored values routinely arrive as full ISO strings even where the form declares a narrower
     * pattern; the strict parse fails on those, and the field used to render empty.
     */
    it("falls back to ISO parsing when the value is wider than the format", () => {
        render(<DateInput valueFormat="YYYY-MM-DD" displayFormat="YYYY-MM-DD" value="2026-03-15T09:30:00"/>);
        expect(dateBox().value).toBe("2026-03-15");
    });

    it("hydrates a UTC-midnight instant as that UTC calendar day", () => {
        render(
            <DateInput
                valueFormat="YYYY-MM-DD"
                displayFormat="YYYY-MM-DD"
                value="2026-03-15T00:00:00.000Z"
            />,
        );
        expect(dateBox().value).toBe("2026-03-15");
    });

    it("hydrates a datetime instant in the given timezone", () => {
        render(
            <DateInput
                valueFormat="YYYY-MM-DD HH:mm"
                displayFormat="YYYY-MM-DD HH:mm"
                timeZone="Europe/Berlin"
                value="2026-03-15T13:00:00.000Z"
            />,
        );
        expect(dateBox().value).toBe("2026-03-15 14:00");
    });

    it("shows a plain date as the localized long date when no display pattern is given", () => {
        render(<DateInput valueFormat="YYYY-MM-DD" value="2026-03-15"/>);
        expect(dateBox().value).toBe(formatDate(new Date(2026, 2, 15), {format: DATE_FORMATS.longDate}));
    });


    it("keeps an unparseable value out of the field", () => {
        render(<DateInput valueFormat="YYYY-MM-DD" value="not a date"/>);
        expect(dateBox().value).toBe("");
    });
});

describe("DateInput clearing", () => {
    it("offers no clear control while the field is empty", () => {
        render(<DateInput valueFormat="YYYY-MM-DD" value=""/>);
        expect(screen.queryByRole("button", {name: "Clear"})).not.toBeInTheDocument();
    });

    it("emits an empty string and is reachable as a real button", () => {
        const onChange = vi.fn();
        render(<DateInput valueFormat="YYYY-MM-DD" value="2026-03-15" onChange={onChange}/>);
        const clear = screen.getByRole("button", {name: "Clear"});
        // Previously a `span role="button"` with tabIndex -1: no keyboard route to clearing.
        expect(clear.tagName).toBe("BUTTON");
        expect(clear).not.toHaveAttribute("tabindex");
        fireEvent.click(clear);
        expect(onChange).toHaveBeenCalledWith("");
    });

    it("does not emit when disabled", () => {
        const onChange = vi.fn();
        render(<DateInput valueFormat="YYYY-MM-DD" value="2026-03-15" onChange={onChange} disabled/>);
        fireEvent.click(screen.getByRole("button", {name: "Clear"}));
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe("DateInput time panel", () => {
    const openPanel = (ui: React.ReactElement) => {
        render(ui);
        fireEvent.click(dateBox());
    };

    it("exposes one tab stop per column and moves the selection with the keyboard", () => {
        const onChange = vi.fn();
        openPanel(<DateInput timeOnly valueFormat="HH:mm" value="09:30" onChange={onChange}/>);

        const hours = screen.getByRole("listbox", {name: "Hr"});
        const options = screen.getAllByRole("option", {name: /^\d{2}$/}).filter((o) => hours.contains(o));
        expect(options.filter((o) => o.tabIndex === 0)).toHaveLength(1);
        expect(screen.getByRole("option", {name: "09", selected: true})).toBeInTheDocument();

        fireEvent.keyDown(hours, {key: "ArrowDown"});
        expect(onChange).toHaveBeenCalledWith("10:30");

        onChange.mockClear();
        fireEvent.keyDown(hours, {key: "End"});
        expect(onChange).toHaveBeenCalledWith("23:30");
    });

    it("emits the picked minute alongside the kept hour", () => {
        const onChange = vi.fn();
        openPanel(<DateInput timeOnly valueFormat="HH:mm" value="09:30" onChange={onChange}/>);

        const minutes = screen.getByRole("listbox", {name: "Min"});
        fireEvent.click(screen.getAllByRole("option", {name: "45"}).find((o) => minutes.contains(o))!);
        expect(onChange).toHaveBeenCalledWith("09:45");
    });

    /** The calendar opened on today's month, so a stored date elsewhere was off-screen. */
    it("opens on the month of the current value and keeps the time when a day is picked", () => {
        const onChange = vi.fn();
        openPanel(
            <DateInput
                valueFormat="YYYY-MM-DD HH:mm"
                value="2026-03-15 09:30"
                timeZone="Europe/Berlin"
                onChange={onChange}
            />,
        );

        const day = screen
            .getAllByRole("button")
            .find((b) => b.textContent === "20" && b.closest("table") != null);
        fireEvent.click(day!);
        expect(onChange).toHaveBeenCalledWith("2026-03-20T08:30:00.000Z");
    });

    it("emits a picked day in its value pattern", () => {
        const onChange = vi.fn();
        openPanel(<DateInput valueFormat="YYYY-MM-DD" value="2026-03-15" onChange={onChange}/>);

        const day = screen
            .getAllByRole("button")
            .find((b) => b.textContent === "20" && b.closest("table") != null);
        fireEvent.click(day!);
        expect(onChange).toHaveBeenCalledWith("2026-03-20");
    });

    it("omits the calendar in time-only mode", () => {
        openPanel(<DateInput timeOnly valueFormat="HH:mm" value="09:30"/>);
        expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    });
});

/** TD-F42: a weekly window that runs until midnight ends at 24:00, which the picker could not offer. */
describe("DateInput end of day (allowEndOfDay)", () => {
    const openPanel = (ui: React.ReactElement) => {
        render(ui);
        fireEvent.click(dateBox());
    };
    const hourOptions = () => {
        const hours = screen.getByRole("listbox", {name: "Hr"});
        return screen.getAllByRole("option").filter((o) => hours.contains(o));
    };
    const minuteOptions = () => {
        const minutes = screen.getByRole("listbox", {name: "Min"});
        return screen.getAllByRole("option").filter((o) => minutes.contains(o));
    };

    it("does not offer 24 unless enabled", () => {
        openPanel(<DateInput timeOnly valueFormat="HH:mm" value="09:30"/>);
        expect(hourOptions().map((o) => o.textContent).at(-1)).toBe("23");
    });

    it("does not offer 24 outside time-only mode", () => {
        openPanel(<DateInput valueFormat="YYYY-MM-DD HH:mm" value="2026-03-15 09:30" allowEndOfDay/>);
        expect(hourOptions().map((o) => o.textContent).at(-1)).toBe("23");
    });

    it("offers 24 after 23 and emits the picked end of day as 24:00", () => {
        const onChange = vi.fn();
        openPanel(<DateInput timeOnly valueFormat="HH:mm" value="22:30" allowEndOfDay onChange={onChange}/>);
        const last = hourOptions().at(-1)!;
        expect(last.textContent).toBe("24");
        fireEvent.click(last);
        expect(onChange).toHaveBeenCalledWith("24:00");
    });

    it("reaches 24:00 from the keyboard too", () => {
        const onChange = vi.fn();
        openPanel(<DateInput timeOnly valueFormat="HH:mm" value="23:15" allowEndOfDay onChange={onChange}/>);
        fireEvent.keyDown(screen.getByRole("listbox", {name: "Hr"}), {key: "End"});
        expect(onChange).toHaveBeenCalledWith("24:00");
    });

    it("shows a stored 24:00 as 24:00 with hour 24 selected and only :00 minutes", () => {
        render(<DateInput timeOnly valueFormat="HH:mm" value="24:00" allowEndOfDay/>);
        expect(dateBox().value).toBe("24:00");
        fireEvent.click(dateBox());
        expect(screen.getByRole("option", {name: "24", selected: true})).toBeInTheDocument();
        expect(minuteOptions().map((o) => o.textContent)).toEqual(["00"]);
    });

    it("leaves the end of day for an ordinary time when another hour is picked", () => {
        const onChange = vi.fn();
        openPanel(<DateInput timeOnly valueFormat="HH:mm" value="24:00" allowEndOfDay onChange={onChange}/>);
        fireEvent.click(hourOptions().find((o) => o.textContent === "18")!);
        expect(onChange).toHaveBeenCalledWith("18:00");
    });

    it("clears a stored 24:00", () => {
        const onChange = vi.fn();
        render(<DateInput timeOnly valueFormat="HH:mm" value="24:00" allowEndOfDay onChange={onChange}/>);
        fireEvent.click(screen.getByRole("button", {name: "Clear"}));
        expect(onChange).toHaveBeenCalledWith("");
    });

    it("does not show 24:00 when the option is off", () => {
        render(<DateInput timeOnly valueFormat="HH:mm" value="24:00"/>);
        expect(dateBox().value).toBe("");
    });
});
