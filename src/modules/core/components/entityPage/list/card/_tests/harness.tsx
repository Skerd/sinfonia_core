/**
 * Shared scaffolding for the entity-card characterization tests.
 *
 * These components had no test coverage at all, so the suite exists first to pin current
 * behaviour and only then to prove each fix. It follows the viewEngine harness
 * (`base/components/viewEngine/_tests/harness.tsx`): probes record the props a component
 * actually received, so assertions read real data flow rather than rendered markup.
 *
 * Two things every card test needs and neither is worth repeating per file:
 *  - a redux store, because `DisplayValue` / `DisplayRow` select `authentication.user.timezone`
 *    and `withLanguage` subscribes to `language`;
 *  - an `AccessContext`, because `useAccess(resource)` reads the map rather than a prop —
 *    so access is supplied the way the app supplies it, not by mocking the hook.
 *
 * The probes themselves live in `probes.tsx`, which imports nothing from the app: `vi.mock`
 * factories must be able to import them without pulling this file's `accessContext` chain.
 */
import type {ReactNode} from "react";
import {render} from "@testing-library/react";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import {
    AccessContext,
    type AccessContextValue,
    type AccessObject,
} from "@coreModule/helpers/context/accessContext.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import type {EntityCardProps} from "@coreModule/components/entityPage/list/card/entityCard.tsx";

export * from "./probes.tsx";
import {makeProbe} from "./probes.tsx";

/* ---------------------------------------------------------------- access */

/**
 * `read` mirrors the server's field map: `true` grants every path, an object grants the keys
 * present in it, `{}` / `false` deny the card outright (see `hasCardRead`).
 */
export function accessObject(resourceId: string, overrides: Partial<AccessObject> = {}): AccessObject {
    return {
        read: true,
        write: true,
        create: true,
        delete: true,
        restore: true,
        resourceId,
        renderComponentOnError: false,
        ifProp: "",
        ifPropValue: undefined,
        ...overrides,
    };
}

/** Access map keyed the way `useAccess` looks it up: lower-cased resource id. */
export function accessMap(resourceId: string, overrides: Partial<AccessObject> = {}): AccessContextValue {
    return {[resourceId.toLowerCase()]: {self: accessObject(resourceId, overrides)}};
}

/* ---------------------------------------------------------------- render */

export type RenderCardOptions = {
    access?: AccessContextValue;
    timezone?: string;
};

function makeStore(timezone: string) {
    return configureStore({
        reducer: {
            /* Static slices: nothing under test dispatches, these only satisfy the selectors. */
            authentication: () => ({user: {timezone}}),
            language: () => ({selectedLanguage: "en-US", languages: []}),
        },
    });
}

/**
 * `rerender` re-wraps in the same providers. Testing Library's own `rerender` replaces the
 * whole tree, which would drop the store and the access map and silently hide the card.
 */
export function renderWithCardEnv(ui: ReactNode, {access = {}, timezone = "UTC"}: RenderCardOptions = {}) {
    const store = makeStore(timezone);
    const wrap = (node: ReactNode) => (
        <Provider store={store as never}>
            <AccessContext value={access}>{node}</AccessContext>
        </Provider>
    );
    const result = render(wrap(ui));
    return {...result, rerender: (node: ReactNode) => result.rerender(wrap(node))};
}

/* ---------------------------------------------------------------- fixtures */

/**
 * Intersects `DeletedData` rather than redeclaring the soft-delete fields, so the fixture cannot
 * drift from the real shape — `deletedAt` is a `Date`, not an ISO string.
 */
export type TestEntity = DeletedData & {
    _id: string;
    name?: string;
    code?: string;
};

export function entity(overrides: Partial<TestEntity> = {}): TestEntity {
    return {_id: "entity-1", name: "Alpha", code: "A-1", ...overrides};
}

/** What `EntityCard`'s render-prop child is handed. Lets tests stay annotation-free. */
export type CardChildCtx = {
    entity: TestEntity;
    read: unknown;
    setAction: (action: string) => void;
    setEntity: (entity: TestEntity) => void;
};

/** Everything `EntityCard` requires except the child, so a test only spells out what it exercises. */
export type BaseCardProps = Omit<EntityCardProps<TestEntity>, "children">;

export function baseCardProps(overrides: Partial<BaseCardProps> = {}): BaseCardProps {
    return {
        resource: "widgets",
        entity: entity(),
        editPath: () => "/edit",
        Sheet: makeProbe("Sheet"),
        sheetEntityProp: "entity",
        deleteUrl: "/api/widget",
        restoreUrl: "/api/widget/restore",
        failedTitle: "failed",
        failedDescription: "failed-description",
        ...overrides,
    };
}
