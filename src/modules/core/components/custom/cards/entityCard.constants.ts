/** Shared layout tokens for property management entity cards and list grids. */

/**
 * The card outline comes from Card's own `ring-1 ring-foreground/10`, which is
 * token-driven and therefore correct in both themes; the raised state adds the
 * `--elevation-*` shadow on top. The `shadow-md` this replaced was a fixed
 * black shadow that all but disappeared on a dark surface.
 *
 * `h-fit`: cards sit in an `align-items: start` grid, so each keeps its natural
 * height instead of stretching to the tallest sibling in the row.
 */
export const CARD_SHELL_CLASS =
    "group h-fit gap-0 p-0 transition-[box-shadow,--tw-ring-color] duration-200";

export const CARD_SHELL_CLICKABLE_CLASS =
    `${CARD_SHELL_CLASS} hover:cursor-pointer hover:shadow-e2 hover:ring-primary/40`;

export const CARD_BODY_CLASS = "flex w-full flex-col gap-1 p-(--density-pad)";

export const CARD_INFO_ROWS_CLASS = "flex flex-wrap gap-x-2 gap-y-1";

/** Opt-in two fields per row. Pass as `EntityCard.Body` `className`. */
export const CARD_INFO_ROWS_TWO_COL_CLASS =
    "grid min-w-0 grid-cols-2 [&_[data-slot=item]]:w-full [&_[data-slot=restricted-fields]]:col-span-2";

/** Driven by `--card-media-height` so the list skeleton reserves the same box. */
export const MEDIA_HEADER_MIN_HEIGHT = "min-h-(--card-media-height)";

/**
 * Corner rounding is intentionally absent: Card clips its children with
 * `overflow-hidden rounded-xl`. A previous `rounded-te-2xl` here emitted no CSS
 * at all, so the media was already relying on the Card to clip it.
 */
export const MEDIA_CAROUSEL_CLASS =
    "w-full overflow-hidden min-h-(--card-media-height)";

/*
 * Card lists use CSS multi-column mosaic (`.grid-hierarchy` / `.grid-transactional`
 * in index.css): default is 5 columns on a full panel pane, dropping to fewer
 * on narrower widths via `--grid-card-min*`. Short cards pack under taller ones
 * instead of leaving row gutters. Reading order is top-to-bottom per column.
 *
 * Pair every list item with {@link GRID_MASONRY_ITEM}. Cap at 4 columns with
 * {@link GRID_COLS_MAX_4} for denser cards (modification requests, leads,
 * reservations, sales).
 */

/** Hierarchy entity lists (projects, edifices, floors, units): media-led cards. */
export const GRID_HIERARCHY = "grid-hierarchy";

/** CRM / workflow entity lists: text-led cards, so they pack tighter. */
export const GRID_TRANSACTIONAL = "grid-transactional";

/** Override `--grid-cols-max` to 4 on a hierarchy/transactional grid. */
export const GRID_COLS_MAX_4 = "grid-cols-max-4";

export const GRID_COLS_MAX_3 = "grid-cols-max-3";

/** Wrapper on each card (and skeleton) inside an entity card mosaic. */
export const GRID_MASONRY_ITEM = "h-fit min-h-0 w-full break-inside-avoid";

/**
 * KPI tile rows. Same intrinsic policy as the entity grids: `auto-fit` +
 * `1fr` fills the row; the fixed `sm:grid-cols-2 lg:grid-cols-5` these
 * replaced produced a ragged 4-then-5 rhythm and squeezed five tiles into a
 * laptop width that only fits three legible ones.
 */
export const GRID_KPI =
    "grid gap-(--density-gap-sm) grid-cols-[repeat(auto-fit,minmax(min(var(--grid-kpi-min),100%),1fr))]";

export const DASHBOARD_SELECTABLE_RING =
    "ring-2 ring-primary shadow-lg shadow-primary/20 hover:ring-primary";

/** Semantic status badge tokens (maps to --status-* CSS variables). */
export const STATUS_BADGE_SUCCESS =
    "border-status-sold/30 bg-status-sold/10 text-status-sold";
export const STATUS_BADGE_WARNING =
    "border-status-reserved/30 bg-status-reserved/10 text-status-reserved";
export const STATUS_BADGE_DANGER =
    "border-status-blocked/30 bg-status-blocked/10 text-status-blocked";
export const STATUS_BADGE_INFO =
    "border-status-available/30 bg-status-available/10 text-status-available";
export const STATUS_BADGE_NEUTRAL =
    "border-border bg-muted/50 text-muted-foreground";
