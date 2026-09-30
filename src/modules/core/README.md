# Sinfonia core — subdomain ownership

Core UI that is not a feature module. Chat and Studio stay in core; they are not split into `ENABLED_MODULES` packages.

| Subdomain | Owns | Does not own |
|-----------|------|----------------|
| **Panel shell** | Auth-gated layout (`clients/panel/private/index.tsx`), public auth (`clients/panel/public/auth/`), sidebar/route contribution loaders, Redux session/language/notifications, `apiClient`, access context | Feature menu trees (those come from each module's `sidebarContribution` / `routeConfigContribution`) |
| **View engine** | `components/viewEngine/` (ViewConfig renderers, widget registry, form/sheet shells) and `components/entityPage/` (list/create/edit factories) | Maestro `*.views.ts` authoring; SchemaDef/Zod; feature widget contributions |
| **Chat** | Panel chat + website (public) inbox under `clients/panel/private/chat/` and `websiteChats/`; WebSocket helpers; channel/message API clients | Feature-module domain chats (none today). Order/lead attachments stay on those modules' own pages |
| **Studio** | `clients/studio/` (catalog, view/table editors, source index plugin). Served as `VITE_SINFONIA_APP=studio` | Generating ViewConfig for a feature; that remains Maestro `*.views.ts` |

## Studio catalog (`studioModules.ts`)

`STUDIO_MODULES` and `MODULE_BY_API_NAMESPACE` are a **static catalog**, not generated from `VITE_ENABLED_MODULES` or `scripts/modules.manifest.json`.

Grouping keys off `ViewConfig.apiUrl` namespaces (`/api/realEstate/…` → `propertyManagement`). Manifest folder names do not encode those router namespaces, so a generated list would still need the same map.

Keep the catalog in sync when adding a module: folder name in the manifest, a `MODULE_BY_API_NAMESPACE` line, and a `STUDIO_MODULES` row. Disabled modules never reach the client (Vite stubs their graph), so empty groups are already dropped.

## Dates (new code)

New Sinfonia UI uses `formatDate` / `DATE_FORMATS` in `helpers/general/dateTime.ts` (`Intl.DateTimeFormat`). Do not rewrite `viewEngine/engine/format.ts` (`date-fns` `PP` / `PPp`) — that path is view-engine display formatting and stays as-is.

## Token refresh

Maestro issues a JWT access token (`JWT_EXPIRES_IN`) and a refresh token (`REFRESH_TOKEN_EXPIRES_IN`). The panel stores both. There is **no** silent refresh interceptor and **no** refresh HTTP route. `SESSION_EXPIRES_IN` is the server session/cookie TTL, not a client refresh timer.

On 401 / session-expired error codes, `apiClient` dispatches `markSessionExpired` and the user re-authenticates (relogin dialog). Product check before adding refresh: confirm access-token TTL vs session TTL and whether a refresh endpoint is wanted.

## Dev proxy URLs

`VITE_API_BASE_URL` and `VITE_WS_BASE_URL` configure the **Vite dev proxy** in `vite.config.ts` only. The browser always calls same-origin `/api` and `/ws` (nginx in production; Vite proxy in development). They are not read by the client Zod env.
