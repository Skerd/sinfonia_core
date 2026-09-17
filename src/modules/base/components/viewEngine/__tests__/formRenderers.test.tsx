import {beforeEach, describe, expect, it, vi} from "vitest";
import {createRef} from "react";
import {render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import type {Resolver} from "react-hook-form";
import type {ViewConfig, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

vi.mock("@coreModule/clients/panel/moduleContributions/loadWidgetContributions.ts", async () => {
    const pm = await import("@propertyManagementModule/clients/panel/formWidgetRenderers.tsx");
    return {
        getSortedWidgetContributions: () => [
            {
                id: "propertyManagement",
                compoundFormWidgetRenderers: pm.propertyManagementFormWidgetRenderers,
                formWriteAccessKeys: pm.propertyManagementFormWriteAccessKeys,
            },
        ],
    };
});
vi.mock("@baseModule/helpers/hocs/withLanguage.tsx", async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    default: (await import("./harness.tsx")).fakeWithLanguage,
}));
vi.mock("@baseModule/helpers/hocs/withDebug.tsx", () => ({default: () => (c: unknown) => c}));

const {default: FormViewRenderer} = await import("../FormViewRenderer.tsx");
const {default: EditFormViewRenderer} = await import("../editFormViewRenderer.tsx");
const {registerWidget} = await import("../widgetRegistry.ts");
const {rendersOnEditForm} = await import("@coreModule/clients/studio/simulate/formWriteGateMirror.ts");
const {makeProbe, propsOf, resetCalls, t} = await import("./harness.tsx");

const COMPOUND_TOKENS = [
    "#FormFloorPolygon",
    "#FormEdificePolygon",
    "#FormUnitPolygon",
    "#FormExpenditureItemsField",
    "#FormEditMediaField",
    "#FormTabbedRepeater",
    "#FormRepeater",
];

const passResolver: Resolver = async (values) => ({values, errors: {}});

const config = (nodes: ViewNode[]): ViewConfig => ({nodes}) as unknown as ViewConfig;

const input = (name: string, extra: Record<string, unknown> = {}): ViewNode =>
    ({render: "#Input", field: {name, widget: "#Input", ...extra}}) as ViewNode;

function renderedNames(): string[] {
    const names = propsOf("#Input").map((p) => p.name as string)
        .concat(COMPOUND_TOKENS.flatMap((tok) => propsOf(tok).map(() => tok)));
    return [...new Set(names)];
}

beforeEach(() => {
    resetCalls();
    registerWidget("#Input", makeProbe("#Input"));
    for (const tok of COMPOUND_TOKENS) registerWidget(tok, makeProbe(tok));
});

describe("FormViewRenderer", () => {
    const base = {
        resolveLanguageKey: t,
        formSchema: {} as never,
        resolver: passResolver,
        defaultValues: {name: "Ana"},
        loading: false,
        innerRef: createRef<never>(),
        onSubmit: vi.fn(),
        onCancel: vi.fn(),
        hideChrome: true,
    };

    it("renders labelled fields with a required marker, bound to form values", () => {
        render(<FormViewRenderer {...base} config={config([input("name", {label: "nameLabel", required: true})])} />);
        expect(screen.getByText("t:nameLabel")).toBeInTheDocument();
        expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
        expect(propsOf("#Input").at(-1)).toMatchObject({name: "name", value: "Ana"});
        expect(screen.getByText("t:formButtons.submit")).toBeInTheDocument();
    });

    it("renders compound widgets without a FormField wrapper", () => {
        render(<FormViewRenderer {...base} config={config([{render: "#FormRepeater", field: {name: "items", widget: "#FormRepeater"}} as ViewNode])} />);
        expect(propsOf("#FormRepeater").at(-1)).toMatchObject({fieldPrefix: "items", loading: false});
    });

    it("hideActions drops the buttons; renderChildrenFirst moves renderChildren above the fields", () => {
        const {container} = render(
            <FormViewRenderer
                {...base}
                hideActions
                formExtras={{renderChildrenFirst: true}}
                config={config([input("name")])}
                renderChildren={() => <p data-testid="kids" />}
            />,
        );
        expect(screen.queryByText("t:formButtons.submit")).toBeNull();
        const order = [...container.querySelectorAll("[data-testid='kids'], [data-probe='#Input']")].map((el) => el.getAttribute("data-testid") ?? "input");
        expect(order).toEqual(["kids", "input"]);
    });

    it("disables everything while loading", () => {
        render(<FormViewRenderer {...base} loading config={config([input("name")])} />);
        expect(propsOf("#Input").at(-1)?.disabled).toBe(true);
        expect(screen.getByText("t:formButtons.cancel").closest("button")).toBeDisabled();
    });
});

describe("EditFormViewRenderer", () => {
    const base = {
        resolveLanguageKey: t,
        formSchema: {} as never,
        resolver: passResolver,
        loading: false,
        innerRef: createRef<never>(),
        onSubmit: vi.fn(),
        onCancel: vi.fn(),
        hideChrome: true,
        loadingDataErrorTitle: "errTitle",
        loadingDataErrorDescription: "errDesc",
    };

    const mount = (props: Record<string, unknown>) =>
        render(
            <MemoryRouter>
                <EditFormViewRenderer {...base} initialValues={null} config={config([])} {...props} />
            </MemoryRouter>,
        );

    it("resets to the initial values once per entity id", () => {
        const {rerender} = mount({initialValues: {_id: "1", name: "First"}, config: config([input("name")])});
        expect(propsOf("#Input").at(-1)?.value).toBe("First");
        rerender(
            <MemoryRouter>
                <EditFormViewRenderer {...base} initialValues={{_id: "1", name: "Ignored"}} config={config([input("name")])} />
            </MemoryRouter>,
        );
        expect(propsOf("#Input").at(-1)?.value).toBe("First");
    });

    it("shows the loader while loading data and the error view on failure", () => {
        mount({loadingData: true, config: config([input("name")])});
        expect(propsOf("#Input")).toHaveLength(0);
        resetCalls();
        mount({loadingDataError: true, config: config([input("name")])});
        expect(propsOf("#Input")).toHaveLength(0);
        expect(screen.getByText("t:errTitle")).toBeInTheDocument();
    });

    const write = new Set(["name", "polygonCoordinates", "items", "address", "address.city"]);
    const writeAccess = {name: true, polygonCoordinates: true, items: true, address: {keys: {city: true}}};

    const gateCases: [string, ViewNode][] = [
        ["writable field", input("name")],
        ["unwritable field", input("code")],
        ["_id", input("_id")],
        ["skipWriteAccessGate", input("helper", {skipWriteAccessGate: true})],
        ["renderWhenWriteAny", input("code", {renderWhenWriteAny: ["name"]})],
        ["renderWhenWriteAny miss", input("code", {renderWhenWriteAny: ["zip"]})],
        ["nested write key", input("address.city")],
        ["nested write key miss", input("address.zip")],
        ["floor polygon", {render: "x", field: {name: "__floorPolygon", widget: "#FormFloorPolygon"}} as ViewNode],
        ["edifice polygon", {render: "x", field: {name: "any", widget: "#FormEdificePolygon"}} as ViewNode],
        ["expenditure items (not writable)", {render: "x", field: {name: "any", widget: "#FormExpenditureItemsField"}} as ViewNode],
        ["edit media (not writable)", {render: "x", field: {name: "media", widget: "#FormEditMediaField"}} as ViewNode],
        ["tabbed repeater by name", {render: "x", field: {name: "items", widget: "#FormTabbedRepeater"}} as ViewNode],
        ["tabbed repeater by key", {render: "x", field: {name: "rows", widget: "#FormTabbedRepeater", widgetProps: {writeAccessKey: "nope"}}} as ViewNode],
        ["plain compound", {render: "x", field: {name: "items", widget: "#FormRepeater"}} as ViewNode],
        ["plain compound miss", {render: "x", field: {name: "other", widget: "#FormRepeater"}} as ViewNode],
    ];

    it.each(gateCases)("write gate matches the Studio mirror: %s", (_label, node) => {
        mount({initialValues: {_id: "1"}, writeAccess, config: config([node])});
        expect(renderedNames().length > 0).toBe(rendersOnEditForm(node, write));
    });

    it("does not gate without a writeAccess map", () => {
        mount({initialValues: {_id: "1"}, config: config([input("code"), gateCases[8][1]])});
        expect(renderedNames()).toEqual(["code", "#FormFloorPolygon"]);
    });

    // Audit finding 5: the edit form ignored both options the create form supports.
    it("supports hideActions and renderChildrenFirst like the create form", () => {
        const {container} = mount({
            initialValues: {_id: "1"},
            hideActions: true,
            formExtras: {renderChildrenFirst: true},
            config: config([input("name")]),
            renderChildren: () => <p data-testid="kids" />,
        });
        expect(screen.queryByText("t:formButtons.submit")).toBeNull();
        const order = [...container.querySelectorAll("[data-testid='kids'], [data-probe='#Input']")].map((el) => el.getAttribute("data-testid") ?? "input");
        expect(order).toEqual(["kids", "input"]);
    });

    it("passes edit mode and write access to compound widgets", () => {
        mount({initialValues: {_id: "1"}, writeAccess, loadingData: false, config: config([gateCases[14][1]])});
        expect(propsOf("#FormRepeater").at(-1)).toMatchObject({editMode: true, writeAccess});
    });
});
