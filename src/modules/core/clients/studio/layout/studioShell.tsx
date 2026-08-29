import {useCallback, useMemo} from "react";
import {useSearchParams} from "react-router-dom";
import {useSelector} from "react-redux";
import {
    IconArrowBackUp,
    IconArrowForwardUp,
    IconTrash,
    IconInfoCircle,
    IconAlertTriangle,
} from "@tabler/icons-react";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import ThemeSwitch from "@coreModule/components/custom/themeSwitch.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from "@coreModule/components/ui/empty.tsx";
import ModelCatalogPane from "../catalog/modelCatalogPane.tsx";
import StudioCommandPalette from "../command/studioCommandPalette.tsx";
import ShortcutHelp from "./shortcutHelp.tsx";
import {useStudioCatalog} from "../catalog/useStudioCatalog.ts";
import {useStudioDrafts} from "../draft/studioDraftProvider.tsx";
import {draftCount} from "../draft/studioDraftStore.ts";
import ViewEditor from "../view/viewEditor.tsx";
import TableEditor from "../table/tableEditor.tsx";
import {isTableTarget, TABLE_TARGET, type StudioTarget} from "../studioTarget.ts";

const MODEL_PARAM = "model";
const VIEW_PARAM = "view";

export default function StudioShell() {
    const catalog = useStudioCatalog();
    const {
        drafts,
        undo,
        redo,
        canUndo,
        canRedo,
        clearAllDrafts,
        persistError,
        saveState,
        setViewDraft,
    } = useStudioDrafts();
    const user = useSelector((state: RootState) => state.authentication.user);
    const [searchParams, setSearchParams] = useSearchParams();

    /* Selection lives in the URL so a specific view is linkable and survives a reload. */
    const target = useMemo<StudioTarget | null>(() => {
        const collection = searchParams.get(MODEL_PARAM);
        const viewKey = searchParams.get(VIEW_PARAM);
        if (!collection || !viewKey) return null;
        return {collection: collection.toLowerCase(), viewKey};
    }, [searchParams]);

    const selectTarget = useCallback(
        (next: StudioTarget) => {
            setSearchParams((prev) => {
                const params = new URLSearchParams(prev);
                params.set(MODEL_PARAM, next.collection);
                params.set(VIEW_PARAM, next.viewKey);
                return params;
            });
        },
        [setSearchParams],
    );

    /** Collections carrying an unexported draft, for the catalog's dot marker. */
    const draftedCollections = useMemo(() => {
        const set = new Set<string>();
        for (const key of Object.keys(drafts.views)) {
            set.add(key.split(":")[0]!);
        }
        for (const key of Object.keys(drafts.tables)) {
            set.add(key);
        }
        return set;
    }, [drafts]);

    const pending = draftCount(drafts);
    const entry = target ? catalog.byCollection[target.collection] : undefined;

    return (
        <div className="flex h-svh max-h-svh min-h-0 flex-col overflow-hidden">
            <header className="flex shrink-0 items-center gap-3 border-b px-3 py-2">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">Arpeggio Studio</span>
                    <span className="text-3xs text-muted-foreground">view &amp; table config editor</span>
                </div>

                <TooltipDisplayer
                    tooltip={
                        `Signed in as ${user.username || user.email || "unknown"}. ` +
                        "Both config endpoints are permission-filtered, so the Studio shows the " +
                        "effective config for this account — edit as a full-access user."
                    }
                >
                    <Badge variant="outline" className="gap-1">
                        <IconInfoCircle className="size-3" />
                        effective config
                    </Badge>
                </TooltipDisplayer>

                <div className="ml-auto flex items-center gap-1">
                    {pending > 0 && (
                        <Badge variant="secondary" className="tabular-nums">
                            {pending} draft{pending === 1 ? "" : "s"}
                        </Badge>
                    )}
                    {/* Writes are debounced, so say where they have got to. */}
                    {pending > 0 && saveState !== "idle" && (
                        <span
                            className={
                                saveState === "error"
                                    ? "text-3xs text-destructive"
                                    : "text-3xs text-muted-foreground"
                            }
                        >
                            {saveState === "pending" && "saving…"}
                            {saveState === "saved" && "saved"}
                            {saveState === "error" && "not saved"}
                        </span>
                    )}
                    <TooltipDisplayer tooltip="Undo">
                        <Button type="button" variant="ghost" size="icon" disabled={!canUndo} onClick={undo}>
                            <IconArrowBackUp />
                        </Button>
                    </TooltipDisplayer>
                    <TooltipDisplayer tooltip="Redo">
                        <Button type="button" variant="ghost" size="icon" disabled={!canRedo} onClick={redo}>
                            <IconArrowForwardUp />
                        </Button>
                    </TooltipDisplayer>
                    <TooltipDisplayer tooltip="Discard every draft">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={pending === 0}
                            onClick={clearAllDrafts}
                        >
                            <IconTrash />
                        </Button>
                    </TooltipDisplayer>
                    <ThemeSwitch />
                </div>
            </header>

            {persistError && (
                /* Drafts live only in memory until this clears, so it stays on screen
                   rather than being a toast that scrolls away. */
                <div className="flex shrink-0 items-start gap-2 border-b bg-destructive/10 px-3 py-1.5">
                    <IconAlertTriangle className="mt-px size-3.5 shrink-0 text-destructive" />
                    <p className="text-2xs text-destructive">
                        Drafts are not being saved ({persistError}). They are held in memory and
                        will be lost on reload — export or apply anything you need to keep.
                    </p>
                </div>
            )}

            <ShortcutHelp />

            <StudioCommandPalette
                catalog={catalog}
                onSelect={selectTarget}
                actions={[
                    {id: "undo", label: "Undo", run: undo},
                    {id: "redo", label: "Redo", run: redo},
                    {
                        id: "clear",
                        label: `Discard every draft (${pending})`,
                        run: clearAllDrafts,
                    },
                ]}
            />

            <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="w-64 shrink-0">
                    <ModelCatalogPane
                        catalog={catalog}
                        selected={target}
                        onSelect={selectTarget}
                        draftedCollections={draftedCollections}
                        onCreateView={(collection, viewKey, config) => {
                            setViewDraft(collection, viewKey, config);
                            selectTarget({collection, viewKey});
                        }}
                    />
                </div>

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    {!target || !entry ? (
                        <Empty className="h-full">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <IconInfoCircle />
                                </EmptyMedia>
                                <EmptyTitle>Pick a view</EmptyTitle>
                                <EmptyDescription>
                                    {catalog.isHydrated
                                        ? `${catalog.entries.length} models registered. Choose a sheet, form or table on the left.`
                                        : "Loading view and table configurations…"}
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : isTableTarget(target) ? (
                        <TableEditor key={`${entry.collection}:${TABLE_TARGET}`} entry={entry} />
                    ) : (
                        <ViewEditor
                            key={`${entry.collection}:${target.viewKey}`}
                            entry={entry}
                            viewKey={target.viewKey}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
