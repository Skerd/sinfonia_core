/** Shared layout tokens for property management entity cards and list grids. */

/**
 * The card outline comes from Card's own `ring-1 ring-foreground/10`, which is
 * token-driven and therefore correct in both themes. Resting `shadow-e1` and
 * the raised hover `shadow-e2` use `--elevation-*` so both themes stay legible
 * (the old fixed `shadow-md` all but disappeared on dark surfaces).
 *
 * `h-fit`: a card keeps its natural height inside its mosaic lane.
 *
 * Hover scale is transform-only (layout size unchanged) so the lanes do not
 * reflow; `z-10` keeps the enlarged card above neighbors.
 */
export const CARD_SHELL_CLASS =
    "group relative h-fit min-w-0 gap-0 p-0 shadow-sm transition-[box-shadow,--tw-ring-color,transform] duration-200";

export const CARD_SHELL_CLICKABLE_CLASS =
    `${CARD_SHELL_CLASS} hover:cursor-pointer hover:z-10 hover:shadow-e2 hover:ring-primary/40`;

export const CARD_BODY_CLASS = "flex w-full flex-col gap-1 p-(--density-pad)";

export const CARD_INFO_ROWS_CLASS = "flex flex-wrap gap-x-2 gap-y-1";

/** Opt-in two fields per row from `sm` up; one column on mobile. Pass as `EntityCard.Body` `className`. */
export const CARD_INFO_ROWS_TWO_COL_CLASS =
    "grid min-w-0 grid-cols-1 sm:grid-cols-2 [&_[data-slot=item]]:w-full [&_[data-slot=restricted-fields]]:col-span-full";

/** Driven by `--card-media-height` so the list skeleton reserves the same box. */
export const MEDIA_HEADER_MIN_HEIGHT = "min-h-(--card-media-height)";

/**
 * Corner rounding is intentionally absent: Card clips its children with
 * `overflow-hidden rounded-xl`. A previous `rounded-te-2xl` here emitted no CSS
 * at all, so the media was already relying on the Card to clip it.
 */
export const MEDIA_CAROUSEL_CLASS =
    "w-full overflow-hidden min-h-(--card-media-height)";

/**
 * When a gallery sits in the card, pin the action menu to the card chrome
 * (top-right over the media) instead of the text header below it.
 */
export const ACTION_MENU_PIN_WHEN_GALLERY =
    "group-has-[[data-slot=gallery-carousel]]/card:absolute group-has-[[data-slot=gallery-carousel]]/card:top-0 group-has-[[data-slot=gallery-carousel]]/card:right-0 group-has-[[data-slot=gallery-carousel]]/card:z-30 group-has-[[data-slot=gallery-carousel]]/card:m-0 group-has-[[data-slot=gallery-carousel]]/card:p-1.5";

/*
 * Card lists use column lanes (`.grid-hierarchy` / `.grid-transactional`
 * in index.css, laid out by `CardMosaic`): the first row runs left to right
 * so a sort reads across, then each next item stacks in that column. A short
 * card does not leave a hole under it. Default ceiling is 5 columns, dropping
 * on narrower panes via `--grid-card-min*`.
 *
 * Pair every list item with {@link GRID_MASONRY_ITEM}. Cap at 3–4 columns with
 * {@link GRID_COLS_MAX_3} / {@link GRID_COLS_MAX_4} for denser cards
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
/**
 * `p-1` is the ring's room. KPI cards use a 1px ring (2px on hover) drawn
 * outside the border box, and these grids sit in `overflow: auto` scrollports
 * (`.flex-full`). Without inset, that clip eats the ring on the outer edges.
 */
export const GRID_KPI =
    "grid gap-(--density-gap-sm) p-1 grid-cols-[repeat(auto-fit,minmax(min(var(--grid-kpi-min),100%),1fr))]";

/**
 * Overview / dashboard tab layout tokens. One vertical rhythm across every tab
 * so switching tabs does not jump between gap-3 / gap-y-4 / ad-hoc margins.
 */
export const DASHBOARD_TAB_STACK = "flex flex-col gap-4";
export const DASHBOARD_TAB_INTRO = "flex flex-col gap-1";
export const DASHBOARD_SECTION = "flex flex-col gap-2";
export const DASHBOARD_ENTITY_GRID =
    "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";
export const DASHBOARD_CHART_GRID =
    "grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-3";

export const DASHBOARD_SELECTABLE_RING =
    "ring-2 ring-primary shadow-lg shadow-primary/20 hover:ring-primary";

/** Semantic outcome badges (maps to --success/--warning/--destructive/--info). */
export const STATUS_BADGE_SUCCESS =
    "border-success/30 bg-success/10 text-success";
export const STATUS_BADGE_WARNING =
    "border-warning/30 bg-warning/10 text-warning";
export const STATUS_BADGE_DANGER =
    "border-destructive/30 bg-destructive/10 text-destructive";
export const STATUS_BADGE_INFO =
    "border-info/30 bg-info/10 text-info";
export const STATUS_BADGE_NEUTRAL =
    "border-border bg-muted/50 text-muted-foreground";
