import {createContext, useContext, type ReactNode} from "react";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";

type AccessFieldsContextValue = {
    read: unknown;
};

const AccessFieldsContext = createContext<AccessFieldsContextValue | undefined>(undefined);

/** Read map from the nearest `AccessFields`. `undefined` when no provider is mounted. */
export function useAccessFieldsRead(): unknown | undefined {
    return useContext(AccessFieldsContext)?.read;
}

type AccessFieldsBase = {
    children: ReactNode;
    perspective?: "self" | "others";
};

type AccessFieldsProps = AccessFieldsBase & (
    | {resource: string; read?: unknown}
    | {read: unknown; resource?: string}
);

/**
 * Provides a resource `read` map so `DisplayValue` can gate on `path` without
 * repeating `useAccess` / `read` on every field.
 *
 * Nested providers override. An explicit `read` prop skips the hook result
 * (cards that already called `useAccess`).
 */
export function AccessFields({
    children,
    resource,
    perspective = "self",
    read: readProp,
}: AccessFieldsProps) {
    const fromHook = useAccess(resource ?? "", perspective);
    const read = readProp !== undefined ? readProp : fromHook.read;

    return (
        <AccessFieldsContext value={{read}}>
            {children}
        </AccessFieldsContext>
    );
}

export default AccessFields;
