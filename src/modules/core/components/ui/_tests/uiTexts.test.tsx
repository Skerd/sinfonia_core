import {cleanup, render, screen} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import languageReducer, {changeLanguage} from "@coreModule/helpers/redux/slices/languageSlice.ts";
import {Sheet, SheetContent, SheetTitle} from "@coreModule/components/ui/sheet.tsx";
import {Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationNext, PaginationPrevious} from "@coreModule/components/ui/pagination.tsx";
import {Breadcrumb, BreadcrumbEllipsis, BreadcrumbList} from "@coreModule/components/ui/breadcrumb.tsx";
import {Calendar} from "@coreModule/components/ui/calendar.tsx";

function storeIn(languageCode: string) {
    const store = configureStore({reducer: {language: languageReducer}});
    store.dispatch(changeLanguage(languageCode));
    return store;
}

function Primitives() {
    return (
        <>
            <Pagination>
                <PaginationContent>
                    <PaginationItem><PaginationPrevious href="#1" /></PaginationItem>
                    <PaginationItem><PaginationEllipsis /></PaginationItem>
                    <PaginationItem><PaginationNext href="#3" /></PaginationItem>
                </PaginationContent>
            </Pagination>
            <Breadcrumb>
                <BreadcrumbList><li><BreadcrumbEllipsis /></li></BreadcrumbList>
            </Breadcrumb>
        </>
    );
}

/** An open sheet hides the page behind it from screen readers, so it is checked on its own. */
function OpenSheet() {
    return (
        <Sheet open>
            <SheetContent aria-describedby={undefined}>
                <SheetTitle>Sheet</SheetTitle>
            </SheetContent>
        </Sheet>
    );
}

describe("UI primitive texts (TD-F92)", () => {
    it("reads the English texts where no app store holds a language", () => {
        render(<Primitives />);
        expect(screen.getByRole("navigation", {name: "Pagination"})).toBeTruthy();
        expect(screen.getByRole("link", {name: "Go to the previous page"}).textContent).toContain("Previous");
        expect(screen.getByRole("link", {name: "Go to the next page"}).textContent).toContain("Next");
        expect(screen.getByText("More pages")).toBeTruthy();
        expect(screen.getByRole("navigation", {name: "Breadcrumb"})).toBeTruthy();
        expect(screen.getByText("More")).toBeTruthy();
        cleanup();
        render(<OpenSheet />);
        expect(screen.getByRole("button", {name: "Close"})).toBeTruthy();
    });

    it("translates them into the app language", async () => {
        render(<Provider store={storeIn("de-CH")}><Primitives /></Provider>);
        expect(await screen.findByRole("navigation", {name: "Seitennavigation"})).toBeTruthy();
        expect((await screen.findByRole("link", {name: "Zur vorherigen Seite"})).textContent).toContain("Zurück");
        expect((await screen.findByRole("link", {name: "Zur nächsten Seite"})).textContent).toContain("Weiter");
        expect(await screen.findByText("Weitere Seiten")).toBeTruthy();
        expect(await screen.findByRole("navigation", {name: "Brotkrümelnavigation"})).toBeTruthy();
        expect(await screen.findByText("Mehr")).toBeTruthy();
        cleanup();
        render(<Provider store={storeIn("de-CH")}><OpenSheet /></Provider>);
        expect(await screen.findByRole("button", {name: "Schliessen"})).toBeTruthy();
    });

    it("keeps a caller's own caption", async () => {
        render(<Provider store={storeIn("de-CH")}><PaginationNext href="#2" text="Mehr laden" /></Provider>);
        expect((await screen.findByRole("link", {name: "Zur nächsten Seite"})).textContent).toContain("Mehr laden");
    });
});

describe("Calendar week start (TD-F93)", () => {
    /** The weekday headers' accessible names, in column order. */
    const weekdays = () => [...document.querySelectorAll(".rdp-weekday")].map((cell) => cell.getAttribute("aria-label"));

    it("starts the week on Monday in German and on Sunday in American English", () => {
        const month = new Date(2026, 10, 1);
        const {unmount} = render(<Provider store={storeIn("de-CH")}><Calendar month={month} /></Provider>);
        expect(weekdays()[0]).toBe("Monday");
        unmount();
        render(<Provider store={storeIn("en-US")}><Calendar month={month} /></Provider>);
        expect(weekdays()[0]).toBe("Sunday");
    });

    it("lets the caller choose the first day", () => {
        render(<Provider store={storeIn("de-CH")}><Calendar month={new Date(2026, 10, 1)} weekStartsOn={3} /></Provider>);
        expect(weekdays()[0]).toBe("Wednesday");
    });
});
