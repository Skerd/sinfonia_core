import {act, renderHook} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {useLayoutEffect} from "react";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {useEntityCard} from "@baseModule/helpers/hooks/useEntityCard.ts";

type City = {_id: string; name: string; deletedAt?: Date; deletedBy?: unknown};
type Options = Parameters<typeof useEntityCard<City>>[0];

const basel: City = {_id: "c1", name: "Basel"};
const softDelete: DeletedData = {
    deletedAt: new Date("2026-09-01T10:00:00Z"),
    deletedBy: {_id: "u1", name: "Ann", surname: "Lee"},
};

function setup(initial: Partial<Options> = {}) {
    let options: Options = {entityProp: basel, ...initial};
    /** Entities of committed renders only: a render React discards (setState during render) runs no effects. */
    const renders: City[] = [];
    const view = renderHook((current: Options) => {
        const result = useEntityCard<City>(current);
        useLayoutEffect(() => {
            renders.push(result.entity);
        });
        return result;
    }, {initialProps: options});
    const update = (next: Partial<Options>) => {
        options = {...options, ...next};
        view.rerender(options);
    };
    return {...view, update, renders};
}

describe("useEntityCard", () => {
    it("starts with no action, the prop entity, and visible", () => {
        const {result} = setup();
        expect(result.current).toMatchObject({action: "", entity: basel, hideAfterDeletion: false});
    });

    it("adopts a new entity prop without ever rendering the previous one", () => {
        const {result, update, renders} = setup();
        const bern = {_id: "c2", name: "Bern"};
        renders.length = 0;

        update({entityProp: bern});

        expect(result.current.entity).toBe(bern);
        expect(renders.every((entity) => entity === bern)).toBe(true);
    });

    it("keeps local edits until the prop changes", () => {
        const {result, update} = setup();

        act(() => result.current.setEntity({...basel, name: "Basel-Stadt"}));
        update({});
        expect(result.current.entity.name).toBe("Basel-Stadt");

        update({entityProp: {...basel, name: "Basel (server)"}});
        expect(result.current.entity.name).toBe("Basel (server)");
    });

    it("ignores prop changes while sync is off, and adopts the current prop when it turns back on", () => {
        const {result, update} = setup({syncPropOnChange: false});
        const fetched = {_id: "c1", name: "Fetched"};
        act(() => result.current.setEntity(fetched));

        update({entityProp: {_id: "c1", name: "Stale prop"}});
        expect(result.current.entity).toBe(fetched);

        update({syncPropOnChange: true});
        expect(result.current.entity.name).toBe("Stale prop");
    });

    it("hides the card after a hard delete, without calling onDeleteProp", () => {
        const onDeleteProp = vi.fn();
        const {result} = setup({onDeleteProp});

        act(() => result.current.onDelete({}));

        expect(result.current.hideAfterDeletion).toBe(true);
        expect(result.current.entity).toBe(basel);
        expect(onDeleteProp).not.toHaveBeenCalled();
    });

    it("merges soft-delete fields into the entity when there is no onDeleteProp", () => {
        const {result} = setup();

        act(() => result.current.onDelete(softDelete));

        expect(result.current.entity).toEqual({...basel, ...softDelete});
        expect(result.current.hideAfterDeletion).toBe(false);
    });

    it("hands a soft delete to the latest onDeleteProp with the latest entity", () => {
        const first = vi.fn();
        const latest = vi.fn();
        const {result, update} = setup({onDeleteProp: first});
        const renamed = {...basel, name: "Renamed"};

        act(() => result.current.setEntity(renamed));
        update({onDeleteProp: latest});
        act(() => result.current.onDelete(softDelete));

        expect(first).not.toHaveBeenCalled();
        expect(latest).toHaveBeenCalledWith(renamed, softDelete);
        expect(result.current.entity).toBe(renamed);
    });

    it("clears deletion fields on restore, or delegates to onRestoreProp", () => {
        const deleted = {...basel, ...softDelete};
        const local = setup({entityProp: deleted});
        act(() => local.result.current.onRestore());
        expect(local.result.current.entity).toMatchObject({name: "Basel", deletedAt: undefined, deletedBy: undefined});

        const onRestoreProp = vi.fn();
        const delegated = setup({entityProp: deleted, onRestoreProp});
        act(() => delegated.result.current.onRestore());
        expect(onRestoreProp).toHaveBeenCalledTimes(1);
        expect(delegated.result.current.entity).toBe(deleted);
    });

    it("does not lose an update made in the same tick as a delete or restore", () => {
        const {result} = setup();

        act(() => {
            result.current.setEntity((previous) => ({...previous, name: "Renamed"}));
            result.current.onDelete(softDelete);
        });
        expect(result.current.entity).toMatchObject({name: "Renamed", deletedAt: softDelete.deletedAt});

        act(() => {
            result.current.setEntity((previous) => ({...previous, name: "Renamed again"}));
            result.current.onRestore();
        });
        expect(result.current.entity).toMatchObject({name: "Renamed again", deletedAt: undefined});
    });

    it("closes a finished delete or restore confirmation, but keeps the view sheet open", () => {
        const {result} = setup();

        act(() => result.current.setAction("delete"));
        act(() => result.current.onDelete(softDelete));
        expect(result.current.action).toBe("");

        act(() => result.current.setAction("restore"));
        act(() => result.current.onRestore());
        expect(result.current.action).toBe("");

        act(() => result.current.setAction("view"));
        act(() => result.current.onDelete(softDelete));
        act(() => result.current.onRestore());
        expect(result.current.action).toBe("view");
    });

    it("keeps handlers and the result stable across re-renders", () => {
        const {result, update} = setup({onDeleteProp: vi.fn(), onRestoreProp: vi.fn()});
        const first = result.current;

        update({onDeleteProp: vi.fn(), onRestoreProp: vi.fn()});

        expect(result.current).toBe(first);
        expect(result.current.onDelete).toBe(first.onDelete);
        expect(result.current.onRestore).toBe(first.onRestore);
        expect(result.current.setAction).toBe(first.setAction);
        expect(result.current.setEntity).toBe(first.setEntity);
    });
});
