# Sinfonia — Core Module

Sinfonia is the Arpeggio client application. It renders the admin panel, connects to **maestro** over HTTP/WebSocket, and consumes shared types from **armonia**.

The **core** module is always enabled and provides the UI foundation, routing shell, design system, and module contribution framework that feature modules plug into.

## Responsibilities

- **Panel shell** — sidebar, breadcrumbs, theme/language switches, notifications
- **Module contribution system** — sidebar, routes, widgets, tenancy settings
- **View engine** — server-driven forms and tables from maestro `ViewConfig`
- **Entity pages** — reusable list/create/edit page scaffolding
- **Design system** — Radix UI primitives, Tailwind, shared custom components
- **API clients** — authenticated axios instances, error handling
- **Redux store** — session, company, permissions, UI state
- **i18n** — locale files under `assets/languages/`

## Directory layout

```
src/modules/core/
├── assets/
│   ├── brand-icons/
│   └── languages/          # en-US, sq-AL locale JSON
├── clients/
│   └── panel/
│       ├── entryPoint/     # Panel shell, route resolution
│       ├── moduleContributions/  # Contribution loaders (glob-based)
│       ├── pages/
│       ├── private/        # Core panel pages (users, tenancy, chat, …)
│       └── public/         # Login, signup, password reset
├── components/
│   ├── ui/                 # Radix/shadcn primitives
│   ├── uiKit/              # Composed layout patterns
│   ├── custom/             # Shared app components (filter builder, files, …)
│   ├── entityPage/         # Generic CRUD page wrappers
│   └── viewEngine/         # ViewConfig renderer
├── environment/            # Vite env, API base URLs
└── helpers/
    ├── axiosClients/
    ├── hooks/ & hocs/      # withLanguage, useMobile, …
    ├── modules/            # VITE_ENABLED_MODULES filtering
    ├── panel/              # Sidebar nav types
    └── redux/              # Store slices
```

## Module contribution system

Feature modules register UI by exporting contribution files from `clients/panel/`. Core discovers them via Vite globs filtered by `VITE_ENABLED_MODULES`:

| File | Purpose |
|------|---------|
| `sidebarContribution.tsx` | Nav groups and menu items |
| `routeConfigContribution.tsx` | Maps URL segments → page components |
| `widgetContribution.tsx` | Dashboard/home widgets |
| `tenancySettingsContribution.tsx` | Company settings tabs (optional) |

Loaders live in `clients/panel/moduleContributions/`:

- `loadSidebarContributions.ts`
- `loadRouteConfigContributions.ts`
- `loadWidgetContributions.ts`

Contributions are sorted by `order`, then `id`. Route contributions use first-match wins.

## Routing

The panel entry point (`clients/panel/entryPoint/`) parses URL segments (`/menu/subview/...`) and delegates to `runRouteConfigContributions`. Core handles `/users`, `/tenancy`, `/chat`, `/accountSettings`, and public auth routes; feature modules handle their own menu namespaces (e.g. `/eCommerce/products`).

## View engine

`components/viewEngine/` renders maestro-provided `ViewConfig` definitions — dynamic forms, tables, and field bindings without hard-coded page layouts. Used heavily by entity pages and widgets.

## Module selection

Set `VITE_ENABLED_MODULES` (comma-separated) to limit which `src/modules/*` packages are included in the Vite graph and contribution globs. When unset, all present modules load. `core` is always included.

Mirrors maestro's `ENABLED_MODULES`.

## Path aliases

| Alias | Path |
|-------|------|
| `@coreModule/*` | `src/modules/core/*` |
| `@eCommerceModule/*` | `src/modules/eCommerce/*` |
| `@eCommerceMarketplaceModule/*` | `src/modules/eCommerceMarketplace/*` |
| `@propertyManagementModule/*` | `src/modules/propertyManagement/*` |
| `armonia/*` | `../armonia/*` |
| `@/*` | `src/*` |

Run `npm run sync:module-aliases` after adding modules to regenerate aliases in `tsconfig.json` and `vite.config.ts`.

## Related modules

Feature modules extend core and are documented separately:

- [`src/modules/eCommerce`](src/modules/eCommerce/README.md)
- [`src/modules/eCommerceMarketplace`](src/modules/eCommerceMarketplace/README.md)
- [`src/modules/propertyManagement`](src/modules/propertyManagement/README.md)

Armonia contracts: [`../armonia/README.md`](../armonia/README.md)  
Maestro API: [`../maestro/README.md`](../maestro/README.md)

## Development

```bash
npm run sinfoniaDev          # Vite dev server
npm run coreInstallAndDev    # rebuild armonia + start dev
npm run typecheck            # sync aliases + tsc
npm test                     # vitest
```

Limit modules at dev time:

```bash
VITE_ENABLED_MODULES=eCommerce,propertyManagement npm run sinfoniaDev
```
