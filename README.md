# Sinfonia — Core Module

Sinfonia is the Arpeggio client application. One build is one app, chosen with `VITE_SINFONIA_APP`: the admin panel (`core`, default), the public `portal` (shop, clinic and rental sites), the `studio` (ViewConfig editor, dev), and propertyManagement's `public` site and `dyeus` magazine. It connects to **maestro** over HTTP/WebSocket and consumes shared types from **armonia**.

The **core** module is always enabled and provides the UI foundation, routing shell, design system, and module contribution framework that feature modules plug into.

Subdomain ownership (panel shell, view engine, chat, studio): [`src/modules/core/README.md`](src/modules/core/README.md). Chat and Studio stay in core.

## Responsibilities

- **Panel shell** — sidebar, breadcrumbs, theme/language switches, notifications
- **Module contribution system** — sidebar, routes, widgets, tenancy settings
- **View engine** — server-driven forms and tables from maestro `ViewConfig`
- **Entity pages** — reusable list/create/edit page scaffolding
- **Design system** — Radix UI primitives, Tailwind, shared custom components
- **API client** — one axios instance (`helpers/apiClient/apiClient.ts`), used through `withAxios` / `useHttpRequest` (D09)
- **Redux store** — session, language, notifications, chat, UI chrome and server health only (D46)
- **i18n** — locale files under `assets/languages/`, 5 locales (en-US, de-CH, fr-FR, it-IT, sq-AL)

## Directory layout

```
src/modules/core/
├── apps/                   # Vite entries per app: core (panel), portal, studio
├── assets/
│   ├── brand-icons/
│   └── languages/          # en-US, de-CH, fr-FR, it-IT, sq-AL locale JSON
├── clients/
│   ├── portal/             # Public portal pages
│   ├── studio/             # ViewConfig studio (dev)
│   └── panel/
│       ├── entryPoint/     # Panel shell, route resolution
│       ├── private/        # Core panel pages (users, tenancy, chat, …); index.tsx is the auth-gated layout route
│       └── public/         # Login, signup, password reset; auth/index.tsx is the /authenticate/:panel page
├── components/
│   ├── ui/                 # shadcn primitives: the only primitive layer (D22)
│   ├── animate-ui/         # Motion primitives, used only inside ui/
│   ├── viewEngine/         # ViewConfig forms and sheets (see below)
│   ├── entityPage/         # List/create/edit page scaffolding
│   └── custom/             # Core-owned app components (entity cards, system map, domain dialogs)
├── environment/            # Vite env, API base URLs
└── helpers/
    ├── apiClient/          # The axios instance
    ├── hooks/ & hocs/      # withAxios, withLanguage, useHttpRequest, …
    ├── moduleContributions/# Contribution loaders
    ├── modules/            # VITE_ENABLED_MODULES filtering
    ├── general/            # Formatting (dateTime.ts, numbers.ts), names, URLs
    └── redux/              # Store slices
```

## Module contribution system

Feature modules register UI by exporting contribution files from their `clients/<app>/` folders. Core discovers them via eager Vite globs filtered by `VITE_ENABLED_MODULES`; each kind has a loader in `src/modules/core/helpers/moduleContributions/load<Kind>Contributions.ts`:

| File | Purpose |
|------|---------|
| `sidebarContribution.tsx` | Nav groups and menu items |
| `routeConfigContribution.tsx` | Maps URL segments → page components |
| `widgetContribution.tsx` | View-engine widget tokens → components (with their Studio descriptions) |
| `tenancySettingsContribution.tsx` | Company settings tabs |
| `siteRoomContribution.ts` | Extra tenancy system-settings rooms |
| `accountNavContribution.tsx` / `accountSettingsContribution.tsx` | Account menu entries and settings pages |
| `authPanelContribution.tsx` | Extra panels on `/authenticate/:panel` |
| `panelLayoutContribution.ts` | The center panel's class name for a route |
| `portalContribution.tsx` | The module's portal section (URL segment and pages) |

Modules also contribute JSON language fragments, deep-merged across modules: `assets/languages/<locale>/menus.json` (menu labels), `rolesPermissions.json` (permission and role labels) and `personErasure.json` (what the module's person eraser removes, D57).

Contributions are sorted by `order`, then `id`. Route contributions use first-match wins.

## Routing

The panel entry point (`clients/panel/entryPoint/`) parses URL segments (`/menu/subview/...`) and delegates to `runRouteConfigContributions`. Core handles `/users`, `/tenancy`, `/chat`, `/accountSettings`, and public auth routes; feature modules handle their own menu namespaces (e.g. `/eCommerce/products`).

## View engine

The server-driven rendering stack lives in **`src/modules/core/components/`**.

`core/components/viewEngine/` renders maestro-provided `ViewConfig` definitions — dynamic forms, sheets, and field bindings without hard-coded page layouts:

| Path | Contents |
|------|----------|
| `engine/` | Pure primitives: node gates, access maps, ref resolution, formatting, prop readers |
| `registry/` | Token → component tables (`coreContribution.ts`) and icon resolution |
| `form/` · `sheet/` | The two render modes: dispatch tables, shells, mode-specific widgets |
| `audit/` | Audit-log drawer and diff rendering |
| `widgets/` | The token implementations the registry dispatches to — `display/`, `inputs/`, `media/`, `gallery/`, `addresses/`, `repeaters/`, `layout/`, `actions/` |

`core/components/entityPage/` is the list/create/edit page scaffolding built on top of it — `pages/` (page factories), `list/` (card-and-table surface, column config, skeletons), `filters/` (quick filters, filter builder).

Note on i18n: `withLanguage("src/…")` paths must match the calling file (or an entry in `SHARED_DICTIONARIES` in `core/helpers/hocs/_tests/withLanguagePaths.test.ts`) so dictionaries stay colocated with their components.

## Module selection

Set `VITE_ENABLED_MODULES` (comma-separated) to limit which `src/modules/*` packages are included in the Vite graph and contribution globs. When unset, all present modules load. `core` is always included.

Mirrors maestro's `ENABLED_MODULES`.

## Dev proxy

`VITE_API_BASE_URL` (default `http://localhost:81`) and `VITE_WS_BASE_URL` (default `ws://localhost:82`) set the Vite **dev server proxy** targets in `vite.config.ts`. The browser always uses same-origin `/api` and `/ws`. Production sits behind nginx (`solfeggio/clusters/nginx`).

## Tooling

`npm run lint` uses `eslint.config.js`: the recommended sets plus the governance rules (D09 API calls, D22 UI primitives and icons, D23 jsx-a11y as errors, D36 dates). The root `npm run lint` lints sinfonia, maestro and armonia and freezes existing findings in a baseline, so only new ones fail. `vite-plugin-checker` is a dependency but stays **commented out** in `vite.config.ts` — overlay typecheck duplicated `npm run typecheck` on every save. Re-enable locally if you want in-browser tsc.

## Dates

Dates (D36): display through `formatDate` / `formatRelativeToNow` in `src/modules/core/helpers/general/dateTime.ts`; parsing and arithmetic with dayjs. Our code never imports date-fns.

## Token refresh

See [`src/modules/core/README.md`](src/modules/core/README.md). No silent refresh; 401 → relogin.

## Path aliases

| Alias | Path |
|-------|------|
| `@<module>Module/*` | `src/modules/<module>/*`, one per module folder (core, eCommerce, finance, propertyManagement, propertyDevelopment, carRental, dentalClinic, swissOutreach) |
| `armonia/*` | `../armonia/*` |
| `@/*` | `src/*` |

The module aliases come from the module folders: Vite and Vitest build them at start (`scripts/moduleAliases.ts`), and the dev server, `npm run typecheck` and `npm run sync:module-aliases` rewrite the `paths` in `tsconfig.json` to match. Nothing to do by hand after adding a module.

## Related modules

Feature modules extend core and are documented separately:

- [`src/modules/eCommerce`](src/modules/eCommerce/README.md)
- [`src/modules/propertyManagement`](src/modules/propertyManagement/README.md)
- [`src/modules/propertyDevelopment`](src/modules/propertyDevelopment/README.md)
- [`src/modules/carRental`](src/modules/carRental/README.md)
- [`src/modules/dentalClinic`](src/modules/dentalClinic/README.md)
- [`src/modules/swissOutreach`](src/modules/swissOutreach/README.md)

Armonia contracts: [`../armonia/README.md`](../armonia/README.md)  
Maestro API: [`../maestro/README.md`](../maestro/README.md)

## Development

```bash
npm run sinfoniaDev          # Vite dev server (panel)
npm run portal               # portal app (also: studio, publicDev, dyeus)
npm run coreInstallAndDev    # rebuild armonia + start dev
npm run typecheck            # sync aliases + tsc
npm test                     # vitest
npm run lint                 # ESLint
```

Limit modules at dev time:

```bash
VITE_ENABLED_MODULES=eCommerce,propertyManagement npm run sinfoniaDev
```
