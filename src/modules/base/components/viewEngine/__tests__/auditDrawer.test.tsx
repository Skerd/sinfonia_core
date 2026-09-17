import {beforeEach, describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen, within} from "@testing-library/react";

vi.mock("@baseModule/helpers/moduleContributions/loadWidgetContributions.ts", () => ({
    getSortedWidgetContributions: () => [],
}));
vi.mock("@baseModule/helpers/hocs/withLanguage.tsx", async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    default: (await import("./harness.tsx")).fakeWithLanguage,
}));
const get = vi.hoisted(() => vi.fn());
vi.mock("@baseModule/helpers/apiClient/apiClient.ts", () => ({default: {get, post: vi.fn()}}));

const {default: SheetAuditHistoryDrawer} = await import("../audit/sheetAuditHistory.tsx");
const {t} = await import("./harness.tsx");

const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

const change = (field: string, from: unknown, to: unknown) => ({field, from, to});

function mount() {
    return render(
        <SheetAuditHistoryDrawer
            open
            onOpenChange={() => {}}
            documentId="aaaaaaaaaaaaaaaaaaaaaaa1"
            collectionName="units"
            fieldLabels={{price: "priceLabel"}}
            sheetResolveLanguageKey={((key: string) => (key === "priceLabel" ? "Price" : null)) as never}
            resolveLanguageKey={t}
        />,
    );
}

beforeEach(() => {
    get.mockReset();
});

describe("activity drawer", () => {
    it("groups entries by day and shows who did what", async () => {
        get.mockResolvedValueOnce({
            data: {
                entries: [
                    {
                        id: "e1",
                        createdAt: now.toISOString(),
                        action: "UPDATE",
                        actor: {id: "u1", displayName: "Ana Kola"},
                        changes: [change("price", 100, 120)],
                    },
                    {
                        id: "e2",
                        createdAt: yesterday.toISOString(),
                        action: "CREATE",
                        actor: null,
                        changes: [change("price", null, 100)],
                    },
                ],
                nextCursor: null,
            },
        });
        mount();

        expect(await screen.findByText("t:today")).toBeInTheDocument();
        expect(screen.getByText("t:yesterday")).toBeInTheDocument();
        expect(screen.getByText("Ana Kola")).toBeInTheDocument();
        expect(screen.getByText("AK")).toBeInTheDocument();
        expect(screen.getByText("t:systemActor")).toBeInTheDocument();
        expect(screen.getAllByText("Price")).toHaveLength(2);

        // The update shows old → new; the create shows only the new value.
        const [update, create] = screen.getAllByRole("listitem");
        expect(within(update).getByText("100")).toHaveClass("font-mono");
        expect(within(update).getByText("120")).toBeInTheDocument();
        expect(within(create).queryByLabelText("t:to")).toBeNull();
        expect(within(create).getByText("100")).toBeInTheDocument();
    });

    it("shows server-resolved labels for referenced ids, with the id on hover", async () => {
        const known = "bbbbbbbbbbbbbbbbbbbbbbb1";
        const unknown = "bbbbbbbbbbbbbbbbbbbbbbb2";
        get.mockResolvedValueOnce({
            data: {
                entries: [
                    {
                        id: "e1",
                        createdAt: now.toISOString(),
                        action: "UPDATE",
                        actor: {id: "u1", displayName: "Ana"},
                        changes: [change("project", unknown, known), change("constructors", [known], [known, unknown])],
                    },
                ],
                nextCursor: null,
                referenceLabels: {[known]: "Tower A"},
            },
        });
        mount();

        const labels = await screen.findAllByText("Tower A");
        expect(labels).toHaveLength(3);
        expect(labels[0]).toHaveAttribute("title", known);
        expect(screen.getAllByTitle(unknown)[0]).toHaveTextContent("…bbbbbbb2");
    });

    it("folds long change lists behind a toggle", async () => {
        get.mockResolvedValueOnce({
            data: {
                entries: [
                    {
                        id: "e1",
                        createdAt: now.toISOString(),
                        action: "UPDATE",
                        actor: {id: "u1", displayName: "Ana"},
                        changes: ["a", "b", "c", "d", "e", "f"].map((f) => change(f, "old-" + f, "new-" + f)),
                    },
                ],
                nextCursor: null,
            },
        });
        mount();

        expect(await screen.findByText("new-d")).toBeInTheDocument();
        expect(screen.queryByText("new-e")).toBeNull();
        fireEvent.click(screen.getByText("t:showAllChanges (+2)"));
        expect(screen.getByText("new-f")).toBeInTheDocument();
        fireEvent.click(screen.getByText("t:showFewerChanges"));
        expect(screen.queryByText("new-f")).toBeNull();
    });

    it("shows the empty and error states", async () => {
        get.mockResolvedValueOnce({data: {entries: [], nextCursor: null}});
        const {unmount} = mount();
        expect(await screen.findByText("t:empty")).toBeInTheDocument();
        expect(screen.getByText("t:emptyDescription")).toBeInTheDocument();
        unmount();

        get.mockRejectedValueOnce(new Error("boom"));
        mount();
        expect(await screen.findByText("t:errorTitle")).toBeInTheDocument();
        get.mockResolvedValueOnce({data: {entries: [], nextCursor: null}});
        fireEvent.click(screen.getByText("t:retry"));
        expect(await screen.findByText("t:empty")).toBeInTheDocument();
    });
});
