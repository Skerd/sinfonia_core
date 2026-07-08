import type { ComponentType } from "react";
import type { RefSelectCreateFromSearch } from "armonia/src/modules/core/database/filter/refSelectRegistry";
import CreateUserInlineAdapter from "@coreModule/components/custom/apiSelect/adapters/createUserInlineAdapter.tsx";
import type { ApiSelectCreateAdapterProps } from "@coreModule/components/custom/apiSelect/createFromSearchTypes.ts";

/** Sinfonia-only map: React components keyed for `API_SELECT_CREATE_ADAPTER_BY_API_URL`. */
export const API_SELECT_CREATE_ADAPTERS = {
    User: CreateUserInlineAdapter,
} satisfies Record<string, ComponentType<ApiSelectCreateAdapterProps>>;

export type ApiSelectCreateAdapterKey = keyof typeof API_SELECT_CREATE_ADAPTERS;

/** Sinfonia-only: `apiUrl` → adapter registry key. */
export const API_SELECT_CREATE_ADAPTER_BY_API_URL: Readonly<Record<string, ApiSelectCreateAdapterKey>> = {
    "/api/company/users/select": "User",
};

/**
 * When `inlineCreateEntityLabel` is omitted, i18n key under the ApiSelect bundle for the full CTA (e.g. `createNewUser`).
 */
export const API_SELECT_INLINE_CREATE_FALLBACK_LABEL_KEY_BY_API_URL: Readonly<Partial<Record<string, string>>> = {
    "/api/company/users/select": "createNewUser",
};

export type { ApiSelectCreateAdapterProps } from "./createFromSearchTypes";
export type { RefSelectCreateFromSearch };
