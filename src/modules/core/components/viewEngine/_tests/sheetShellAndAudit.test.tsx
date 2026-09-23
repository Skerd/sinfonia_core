import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {act, render, screen, waitFor} from "@testing-library/react";
import type {ViewConfig, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

vi.mock("@coreModule/helpers/moduleContributions/loadWidgetContributions.ts", () => ({
    getSortedWidgetContributions: () => [
        {id: "test", auditSinglePostHints: {"#ProjectSheetView": {url: "/api/project/single", labelFields: ["name"]}}},
    ],
}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    default: (await import("./harness.tsx")).fakeWithLanguage,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({default: () => (c: unknown) => c}));
vi.mock("@coreModule/components/viewEngine/widgets/display/displayCard.tsx", async () => ({
    default: (await import("./harness.tsx")).makeProbe("#DisplayCard"),
}));
const post = vi.hoisted(() => vi.fn());
vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: {post, get: vi.fn()}}));

const {SheetViewRenderer: RealSheetViewRenderer} = await import("../SheetViewRenderer.tsx");
/** Tests pass the HOC-injected props (`onFilterChange`, `loading`, …) by hand. */
const SheetViewRenderer = RealSheetViewRenderer as unknown as ComponentType<Record<string, unknown>>;
const helpers = await import("../viewRendererHelpers.ts");
const {resolveIcon, registerIcon, LEGACY_TO_TABLER_EXPORT} = await import("../widgetRegistry.ts");
const labels = await import("../audit/auditFieldHints.ts");
const audit = await import("../audit/auditDisplayValue.tsx");
const {cardNode, lastProps, renderLinkedSheet, resetCalls, t} = await import("./harness.tsx");

beforeEach(() => {
    resetCalls();
    post.mockReset();
});

describe("SheetViewRenderer", () => {
    const baseConfig = {
        model: "units",
        accessModel: "units",
        apiUrl: "/api/unit",
        nodes: [cardNode("project.name", {linkedRefPath: "project"})],
        header: {
            titleField: "status",
            titleFieldLanguageCategory: "statuses",
            subtitleKey: "unitSheet",
            badges: [
                {render: "#Badge", field: {name: "code", widget: "#Badge", widgetProps: {prefix: "#"}}, props: {variant: "outline"}},
                {render: "#Badge", field: {name: "hidden", widget: "#Badge"}, dependent: "flag"},
                {render: "#Badge", field: {name: "secret", widget: "#Badge"}, permissions: {read: "secret"}},
            ],
        },
    } as unknown as ViewConfig;

    const baseProps = {
        config: baseConfig,
        open: true,
        onOpenChange: vi.fn(),
        resolveLanguageKey: t,
        hideActions: true,
        onFilterChange: vi.fn(),
        loading: false,
        error: null,
    };

    const mount = (props: Record<string, unknown>) =>
        render(<SheetViewRenderer {...baseProps} {...props} />);

    it("renders the configured title, subtitle and badges under read access", () => {
        mount({
            data: {status: "sold", code: "A1", hidden: "H", secret: "S", project: {_id: "p1", name: "Tower"}},
            access: {read: {status: true, code: true, "project.name": true, project: true}},
        });
        expect(screen.getByText("t:statuses.sold")).toBeInTheDocument();
        expect(screen.getByText("t:unitSheet")).toBeInTheDocument();
        expect(screen.getByText("#A1")).toBeInTheDocument();
        expect(screen.queryByText("H")).toBeNull();
        expect(screen.queryByText("S")).toBeNull();
        expect(lastProps("#DisplayCard")).toMatchObject({value: "Tower"});
    });

    it("hides the title without read access", () => {
        mount({data: {status: "sold"}, access: {read: {code: true}}});
        expect(screen.queryByText("t:statuses.sold")).toBeNull();
    });

    it("uses title/description escape hatches and falls back to data.name without a header", () => {
        mount({data: {name: "N"}, access: {read: {}}, headerTitle: <b>Custom</b>, headerDescription: <i>Desc</i>});
        expect(screen.getByText("Custom")).toBeInTheDocument();
        expect(screen.getByText("Desc")).toBeInTheDocument();

        mount({config: {...baseConfig, header: undefined}, data: {name: "Plain"}, access: {read: {name: true}}});
        expect(screen.getByText("Plain")).toBeInTheDocument();
    });

    it("fetches when fetchId and url are set", () => {
        const onFilterChange = vi.fn();
        mount({data: {}, access: {read: {}}, fetchId: "x1", url: "/api/unit/single", onFilterChange});
        expect(onFilterChange).toHaveBeenCalledWith({_id: "x1"});
    });

    it("merges new row props while keeping keys only the single fetch provided", () => {
        const access = {read: {"project.name": true, project: true, extra: true}};
        const {rerender} = mount({data: {project: {_id: "p1", name: "A"}, extra: "keep"}, access});
        rerender(<SheetViewRenderer {...baseProps} data={{project: {_id: "p1", name: "B"}}} access={access} />);
        expect(lastProps("#DisplayCard").value).toBe("B");
    });
});

describe("unlink callbacks through ViewRenderer ctx", () => {
    it("clears a dotted ref and removes a list item", async () => {
        const {registerWidget} = await import("../widgetRegistry.ts");
        const {makeProbe} = await import("./harness.tsx");
        registerWidget("#LinkedProbe", makeProbe("#LinkedProbe"));
        const onSheetRowPatched = vi.fn();
        const config = {
            model: "units",
            nodes: [
                cardNode("project.name", {linkedRefPath: "meta.project", linkedSheetModel: "projects", linkedSheetWidget: "#LinkedProbe"}),
                cardNode("list", {valueType: "linkedObjectRefCardList", linkedSheetModel: "m", linkedSheetWidget: "#LinkedProbe"}),
            ] as ViewNode[],
        } as unknown as ViewConfig;
        render(
            <SheetViewRenderer
                {...{
                    config,
                    open: true,
                    onOpenChange: vi.fn(),
                    resolveLanguageKey: t,
                    hideActions: true,
                    onFilterChange: vi.fn(),
                    loading: false,
                    error: null,
                    access: {read: {}},
                    data: {meta: {project: {_id: "p1", name: "T"}, keep: 1}, list: ["a", "b"]},
                    onSheetRowPatched,
                }}
            />,
        );
        const {propsOf} = await import("./harness.tsx");
        const cards = propsOf("#DisplayCard");
        const single = cards.find((c) => c.linkedReferenceSheet?.resourceId === "projects")!;
        renderLinkedSheet(single.linkedReferenceSheet);
        act(() => lastProps("#LinkedProbe").onDelete());
        await waitFor(() => expect(onSheetRowPatched).toHaveBeenCalledTimes(1));
        expect(onSheetRowPatched.mock.calls[0][0]).toEqual({meta: {project: null, keep: 1}, list: ["a", "b"]});

        const second = cards.filter((c) => c.linkedReferenceSheet?.resourceId === "m")[1];
        renderLinkedSheet(second.linkedReferenceSheet);
        act(() => lastProps("#LinkedProbe").onDelete());
        await waitFor(() => expect(onSheetRowPatched).toHaveBeenCalledTimes(2));
        expect(onSheetRowPatched.mock.calls[1][0].list).toEqual(["a"]);
    });
});

describe("helpers", () => {
    it("hasAccessPath: flat keys, nested `.keys`, missing map", () => {
        expect(helpers.hasAccessPath(undefined, "a")).toBe(true);
        expect(helpers.hasAccessPath({a: true}, undefined)).toBe(true);
        expect(helpers.hasAccessPath({"a.b": false, a: {keys: {b: true}}}, "a.b")).toBe(false);
        expect(helpers.hasAccessPath({a: {keys: {b: true}}}, "a.b")).toBe(true);
        expect(helpers.hasAccessPath({a: {b: true}}, "a.b")).toBe(true);
        expect(helpers.hasAccessPath({a: true}, "a.b")).toBe(false);
        expect(helpers.hasAccessPath({a: {keys: {}}}, "a")).toBe(true);
    });

    it("normalizeObjectIdRef handles strings, objects and non-string ids", () => {
        expect(helpers.normalizeObjectIdRef("x")).toEqual({stub: {_id: "x"}, fetchId: "x"});
        expect(helpers.normalizeObjectIdRef({_id: 5, n: 1})).toEqual({stub: {_id: 5, n: 1}, fetchId: "5"});
        expect(helpers.normalizeObjectIdRef({n: 1})).toEqual({stub: {n: 1}, fetchId: undefined});
        expect(helpers.normalizeObjectIdRef("")).toBeNull();
        expect(helpers.normalizeObjectIdRef(3)).toBeNull();
    });

    it("resolveDisplayCardValueAccessSpec", () => {
        expect(helpers.resolveDisplayCardValueAccessSpec({name: "a", widget: "#DisplayCard"} as never)).toEqual({paths: ["a"], mode: "all"});
        expect(helpers.resolveDisplayCardValueAccessSpec({name: "a", widget: "#DisplayCard", widgetProps: {parent: "p", valuePath: ["x", 1, "y"]}} as never))
            .toEqual({paths: ["p.x", "p.y"], mode: "any"});
        expect(helpers.resolveDisplayCardValueAccessSpec({name: "statistics.n", widget: "#DisplayCard"} as never)).toBeNull();
        expect(helpers.resolveDisplayCardValueAccessSpec(undefined)).toBeNull();
    });

    it("resolveIcon maps legacy names and honours overrides", () => {
        expect(resolveIcon("#Globe")).toBeTruthy();
        expect(resolveIcon("#IconWorld")).toBe(resolveIcon("#Globe"));
        expect(resolveIcon("#Tag")).toBeTruthy();
        expect(resolveIcon("#NotAnIcon__")).toBeNull();
        expect(resolveIcon("")).toBeNull();
        const Mine = () => null;
        registerIcon("#Mine", Mine);
        expect(resolveIcon("#Mine")).toBe(Mine);
    });

    /*
     * The map is hand-written against Tabler's export names, and a wrong one
     * fails silently: `resolveIcon` returns null and the field simply renders
     * without its icon, which nobody notices in review. Six entries were added
     * because six view-config tokens were resolving to nothing.
     */
    it("resolves every legacy icon name it claims to map", () => {
        const broken = Object.entries(LEGACY_TO_TABLER_EXPORT)
            .filter(([token]) => resolveIcon(`#${token}`) === null)
            .map(([token, target]) => `#${token} → ${target}`);

        expect(broken).toEqual([]);
    });
});

describe("audit field hints and labels", () => {
    const nodes = [
        {render: "#SheetGroup", children: [
            cardNode("project.name", {linkedRefPath: "project", linkedSheetWidget: "#ProjectSheetView"}, {label: "projectLabel"}),
            {render: "x", field: {name: "photos", widget: "#SheetMediaFilesStrip", widgetProps: {combineFromFields: ["a", "b"]}}},
            {render: "x", field: {name: "owner", widget: "#ApiSelect", widgetProps: {apiUrl: " /api/user/select "}, label: "ownerLabel"}},
            {render: "x", field: {name: "country", widget: "#TenancyCountryCard"}},
        ]},
    ] as ViewNode[];

    it("collects hints by persisted path, strongest first", () => {
        const hints = labels.collectAuditFieldHintsFromViewNodes(nodes);
        expect(hints).toEqual({
            "project.name": {kind: "singlePost", url: "/api/project/single", labelFields: ["name"]},
            project: {kind: "singlePost", url: "/api/project/single", labelFields: ["name"]},
            photos: {kind: "media"},
            a: {kind: "media"},
            b: {kind: "media"},
            owner: {kind: "apiSelect", selectUrl: "/api/user/select"},
            country: {kind: "singlePost", url: "/api/auxiliary/country/single", labelFields: ["name"]},
        });
        expect(labels.auditHintOrPrimitive("zzz", hints)).toEqual({kind: "primitive"});

        const merged = labels.collectAuditFieldHintsFromViewConfigs([
            {nodes: [{render: "x", field: {name: "owner", widget: "#MediaField"}}] as ViewNode[]},
            {nodes},
            null,
        ]);
        expect(merged.owner).toEqual({kind: "media"});
    });

    it("collects labels, also under the linked ref path", () => {
        expect(labels.collectFieldLabelsFromViewNodes(nodes)).toEqual({
            "project.name": "projectLabel",
            project: "projectLabel",
            owner: "ownerLabel",
        });
    });
});

describe("audit value presentation", () => {
    it("formats scalars and select urls", () => {
        expect(audit.formatAuditScalar(null)).toBe("—");
        expect(audit.formatAuditScalar({a: 1})).toBe('{"a":1}');
        expect(audit.formatAuditScalar("x".repeat(500)).length).toBe(500);
        expect(audit.formatAuditScalar({s: "x".repeat(500)})).toMatch(/^.{440}…$/);
        expect(audit.auditSelectUrlToSingleUrl("/api/x/select/")).toBe("/api/x/single");
        expect(audit.auditSelectUrlToSingleUrl("/api/x/list")).toBeNull();
    });

    it("resolves a ref label through POST …/single", async () => {
        post.mockResolvedValueOnce({data: {data: {_id: "aaaaaaaaaaaaaaaaaaaaaaa1", name: "Resolved"}}});
        render(
            <audit.AuditDiffValuePresentation
                value="aaaaaaaaaaaaaaaaaaaaaaa1"
                hint={{kind: "singlePost", url: "/api/one/single", labelFields: ["name"]}}
                resolveLanguageKey={t}
            />,
        );
        expect(await screen.findByText("Resolved")).toBeInTheDocument();
        expect(post).toHaveBeenCalledWith("/api/one/single", {_id: "aaaaaaaaaaaaaaaaaaaaaaa1"});
    });

    it("shows embedded labels without fetching and shortens bare ids", () => {
        render(
            <audit.AuditDiffValuePresentation
                value={[{_id: "bbbbbbbbbbbbbbbbbbbbbbb1", name: "Emb"}, "bbbbbbbbbbbbbbbbbbbbbbb2"]}
                hint={{kind: "primitive"}}
                resolveLanguageKey={t}
            />,
        );
        expect(screen.getByText("Emb")).toBeInTheDocument();
        expect(screen.getByTitle("bbbbbbbbbbbbbbbbbbbbbbb2")).toHaveTextContent("…bbbbbbb2");
        render(<audit.AuditDiffValuePresentation value="cccccccccccccccccccccc12" hint={{kind: "primitive"}} resolveLanguageKey={t} />);
        expect(screen.getByText("…cccccc12")).toBeInTheDocument();
    });

    // Audit finding 4: a failed lookup used to be cached forever.
    it("retries a label lookup that failed earlier", async () => {
        const id = "ddddddddddddddddddddddd1";
        const hint = {kind: "singlePost" as const, url: "/api/retry/single", labelFields: ["name"]};
        post.mockRejectedValueOnce(new Error("offline"));
        const first = render(<audit.AuditDiffValuePresentation value={id} hint={hint} resolveLanguageKey={t} />);
        await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
        first.unmount();

        post.mockResolvedValueOnce({data: {_id: id, name: "Back online"}});
        render(<audit.AuditDiffValuePresentation value={id} hint={hint} resolveLanguageKey={t} />);
        expect(await screen.findByText("Back online", {}, {timeout: 300})).toBeInTheDocument();
    });
});
