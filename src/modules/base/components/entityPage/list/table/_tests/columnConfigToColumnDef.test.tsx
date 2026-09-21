import {renderHook} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import type {ReactNode} from "react";
import languageReducer from "@baseModule/helpers/redux/slices/languageSlice.ts";
import type {TableColumnConfig} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";
import {columnConfigToColumnDef} from "@baseModule/components/entityPage/list/table/columnConfigToColumnDef.tsx";

const column = (id: string, accessorPath: string): TableColumnConfig => ({
    id,
    accessorPath,
    labelKey: `fields.${id}`,
    cellType: "text",
    sortable: true,
    visible: true,
} as unknown as TableColumnConfig);

const COLUMNS = [column("name", "name"), column("code", "code"), column("phoneCode", "phoneCode")];

/** `columnConfigToColumnDef` calls `useSelectedLanguage`, so it has to run inside a store. */
const wrapper = ({children}: {children: ReactNode}) => (
    <Provider store={configureStore({reducer: {language: languageReducer}})}>{children}</Provider>
);

function columnIds(read: unknown): (string | undefined)[] {
    const {result} = renderHook(
        () => columnConfigToColumnDef(COLUMNS, {fields: {}, timezone: "UTC", read}),
        {wrapper},
    );
    return result.current.map((def) => def.id);
}

describe("columnConfigToColumnDef read gating", () => {
    it("keeps every column when the server grants them all", () => {
        expect(columnIds({name: {}, code: {}, phoneCode: {}})).toEqual(["name", "code", "phoneCode"]);
    });

    /* Unticking `name` in the withDebug access panel removes it from the read map. */
    it("drops a column whose field was denied", () => {
        expect(columnIds({code: {}, phoneCode: {}})).toEqual(["code", "phoneCode"]);
    });

    it("keeps every column for an allow-all grant, or before the map loads", () => {
        expect(columnIds(true)).toEqual(["name", "code", "phoneCode"]);
        expect(columnIds(undefined)).toEqual(["name", "code", "phoneCode"]);
    });

    it("drops every field column when read is denied outright", () => {
        expect(columnIds(false)).toEqual([]);
        expect(columnIds({})).toEqual([]);
    });
});
