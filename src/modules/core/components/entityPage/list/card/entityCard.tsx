import {
    createContext,
    createElement,
    useContext,
    useImperativeHandle,
    useMemo,
    type ComponentType,
    type ReactNode,
    type RefObject,
} from "react";
import {accessFieldPathExists, type AccessPerspective} from "@coreModule/helpers/context/accessContext.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {useEntityCard} from "@coreModule/helpers/hooks/useEntityCard.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import DeletedInfo from "@coreModule/components/viewEngine/widgets/display/deletedInfo.tsx";
import AccessFields from "@coreModule/components/viewEngine/widgets/display/accessFields.tsx";
import DisplayValue from "@coreModule/components/viewEngine/widgets/display/displayValue.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";
import ActionMenu from "@coreModule/components/viewEngine/widgets/actions/menu/actionMenu.tsx";
import DeleteAction from "@coreModule/components/viewEngine/widgets/actions/deleteAction.tsx";
import RestoreAction from "@coreModule/components/viewEngine/widgets/actions/restoreAction.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import {ErrorView} from "@coreModule/components/custom/errors/errorView.tsx";
import {EntityCardShell} from "@coreModule/components/entityPage/list/card/entityCardShell.tsx";
import {isDialogDismissGuarded} from "@coreModule/components/ui/dialog.tsx";
import {EntityCardHeader as EntityTextCardHeader} from "@coreModule/components/entityPage/list/card/entityCardHeader.tsx";
import {useEntityCardFetch} from "@coreModule/helpers/hooks/useEntityCardFetch.ts";
import {findFromObject} from "@coreModule/helpers/general/objectPath.ts";

const CARD_CONTENT_CLASS =
    "flex w-full min-w-0 flex-col gap-(--density-pad) p-(--density-pad) [&>[data-slot=gallery-carousel]]:-mx-(--density-pad) [&>[data-slot=gallery-carousel]]:-mt-(--density-pad) [&>[data-slot=gallery-carousel]]:w-[calc(100%+2*var(--density-pad))]";

type SoftDeletable = DeletedData & {
    _id: string;
};

/** `read === true` is allow-all. `false`, `{}`, and non-objects deny. */
export function hasCardRead(read: unknown): boolean {
    if (read === true) return true;
    if (!read || typeof read !== "object") return false;
    return Object.keys(read).length > 0;
}

type EntityCardSheetProps<T> = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete?: (data: DeletedData) => void;
    onRestore?: () => void;
    hideActions?: boolean;
} & Record<string, T | unknown>;

type EntityCardActionCtx<T extends SoftDeletable> = {
    action: string;
    setAction: (action: string) => void;
    entity: T;
    setEntity: (entity: T) => void;
    retry: () => void;
};

type EntityCardSheetCtx<T extends SoftDeletable> = {
    entity: T;
    setEntity: (entity: T) => void;
    setAction: (action: string) => void;
};

type EntityCardContextValue = {
    resource: string;
    entity: SoftDeletable;
    read: unknown;
    hideActions?: boolean;
    hideDelete?: boolean;
    hideRestore?: boolean;
    hideEdit?: boolean;
    setAction: (action: string) => void;
    editPath: (entity: SoftDeletable) => string;
    titlePath: string;
};

const EntityCardContext = createContext<EntityCardContextValue | null>(null);

function useEntityCardContext(): EntityCardContextValue {
    const ctx = useContext(EntityCardContext);
    if (!ctx) {
        throw new Error("EntityCard.Header / EntityCard.Body must be rendered inside EntityCard");
    }
    return ctx;
}

export type EntityCardProps<T extends SoftDeletable> = {
    resource: string;
    entity: T;
    /** `self` (default) or `others` — matches `useAccess`'s perspective for security/audit-style entities. */
    accessPerspective?: AccessPerspective;
    fetchId?: string;
    singleUrl?: string;
    onDelete?: (entity: NoInfer<T>, data: DeletedData) => void;
    onRestore?: () => void;
    hideActions?: boolean;
    sheetOnly?: boolean;
    editPath: (entity: NoInfer<T>) => string;
    Sheet: ComponentType<EntityCardSheetProps<NoInfer<T>>>;
    sheetEntityProp: string;
    deleteUrl: string;
    restoreUrl: string;
    failedTitle: string;
    failedDescription: string;
    titlePath?: string;
    innerRef?: RefObject<WithAxiosLifecycleRef<NoInfer<T>> | null>;
    hideDelete?: boolean | ((entity: NoInfer<T>) => boolean);
    hideRestore?: boolean | ((entity: NoInfer<T>) => boolean);
    hideEdit?: boolean | ((entity: NoInfer<T>) => boolean);
    shellClassName?: string | ((entity: NoInfer<T>) => string | undefined);
    shellRef?: RefObject<HTMLDivElement | null>;
    sheetProps?: (ctx: EntityCardSheetCtx<NoInfer<T>>) => Record<string, unknown>;
    extraDialogs?: (ctx: EntityCardActionCtx<NoInfer<T>>) => ReactNode;
    children: (ctx: {
        entity: NoInfer<T>;
        read: unknown;
        setAction: (action: string) => void;
        setEntity: (entity: NoInfer<T>) => void;
    }) => ReactNode;
};

type EntityCardHeaderProps = {
    /** A list means "readable if any of these are" (e.g. a title that falls back between fields). */
    titlePath?: string | string[];
    title: ReactNode;
    subtitle?: ReactNode;
    subtitlePath?: string;
    icon?: ReactNode;
    badges?: ReactNode;
    children?: ReactNode;
};

function EntityCardHeader({
    titlePath: titlePathProp,
    title,
    subtitle,
    subtitlePath = "code",
    icon,
    badges,
    children,
}: EntityCardHeaderProps) {
    const {
        resource,
        entity,
        read,
        hideActions,
        hideDelete,
        hideRestore,
        hideEdit,
        setAction,
        editPath,
        titlePath: hostTitlePath,
    } = useEntityCardContext();
    const titlePath = titlePathProp ?? hostTitlePath;
    const titlePaths = Array.isArray(titlePath) ? titlePath : [titlePath];
    const titleReadable = titlePaths.some((p) => accessFieldPathExists(read, p));
    const hasMenuChildren = children != null && children !== false;

    /* `show` overrides DisplayValue's own path gate, so it has to carry the ACL answer itself. */
    return (
        <EntityTextCardHeader
            className="p-0"
            iconTile={icon}
            title={<DisplayValue path={titlePaths[0]} value={title} show={titleReadable} />}
            subtitle={
                subtitle !== undefined ? (
                    <DisplayValue path={subtitlePath} value={subtitle} show={accessFieldPathExists(read, subtitlePath)} />
                ) : undefined
            }
            badges={badges}
            hideActions={hideActions}
            actionMenu={
                <ActionMenu
                    accessModel={resource}
                    deletedData={entity}
                    onAction={(action: string) => setAction(action)}
                    editPath={editPath(entity)}
                    allowMenuForCustomChildren={hasMenuChildren}
                    hideDelete={hideDelete}
                    hideRestore={hideRestore}
                    hideEdit={hideEdit}
                >
                    {children}
                </ActionMenu>
            }
        />
    );
}

function EntityCardBody({children, className}: {children: ReactNode; className?: string}) {
    /* The value is only read to fail loudly when the body is used outside a card. That still
       subscribes — `useContext` always does — but the card's context value is memoized, so this
       no longer re-renders on every render of the card the way an inline object literal did. */
    useEntityCardContext();
    return <InfoRowGroup className={className}>{children}</InfoRowGroup>;
}

function EntityCardRoot<T extends SoftDeletable>({
    resource,
    entity: entityProp,
    accessPerspective = "self",
    fetchId,
    singleUrl,
    onDelete: onDeleteProp,
    onRestore: onRestoreProp,
    hideActions,
    sheetOnly = false,
    editPath,
    Sheet,
    sheetEntityProp,
    deleteUrl,
    restoreUrl,
    failedTitle,
    failedDescription,
    titlePath = "name",
    innerRef,
    hideDelete,
    hideRestore,
    hideEdit,
    shellClassName,
    shellRef,
    sheetProps,
    extraDialogs,
    children,
}: EntityCardProps<T>) {
    const {
        action,
        setAction,
        entity,
        setEntity,
        hideAfterDeletion,
        onDelete,
        onRestore,
    } = useEntityCard({
        entityProp,
        onDeleteProp,
        onRestoreProp,
        syncPropOnChange: !fetchId,
    });

    const {loading, error, retry} = useEntityCardFetch<T>({
        fetchId,
        singleUrl,
        onSuccess: setEntity,
    });

    /* `setEntity` is a stable setter, so the handle is built once — without the dep array React
       re-ran this on every commit, nulling and reassigning `innerRef.current` each time. */
    useImperativeHandle(
        innerRef,
        () => ({
            success: (data) => {
                if (data != null) setEntity(data);
            },
        }),
        [setEntity],
    );

    const {read, restore} = useAccess(resource, accessPerspective);
    const isDeleted = !!entity.deletedAt || !!entity.deletedBy;

    const resolvedHideEdit = typeof hideEdit === "function" ? hideEdit(entity) : hideEdit;
    const resolvedHideDelete = typeof hideDelete === "function" ? hideDelete(entity) : hideDelete;
    const resolvedHideRestore = typeof hideRestore === "function" ? hideRestore(entity) : hideRestore;

    /*
     * Memoized, and computed above the early returns so the hook order is unconditional. An
     * object literal here published a new context value on every render, which re-rendered every
     * `EntityCard.Header` / `.Body` in the list regardless of whether anything they read changed.
     */
    const contextValue = useMemo<EntityCardContextValue>(
        () => ({
            resource,
            entity,
            read,
            hideActions,
            hideDelete: resolvedHideDelete,
            hideRestore: resolvedHideRestore,
            hideEdit: resolvedHideEdit,
            setAction,
            editPath: editPath as (row: SoftDeletable) => string,
            titlePath,
        }),
        [
            resource,
            entity,
            read,
            hideActions,
            resolvedHideDelete,
            resolvedHideRestore,
            resolvedHideEdit,
            setAction,
            editPath,
            titlePath,
        ],
    );

    if (hideAfterDeletion || (isDeleted && !restore)) {
        return <></>;
    }
    if (!hasCardRead(read)) {
        return <HiddenElement />;
    }

    const titleValue = findFromObject(entity, titlePath);
    const confirmName =
        accessFieldPathExists(read, titlePath) && typeof titleValue === "string" ? titleValue : undefined;
    const showDeleted =
        isDeleted &&
        (accessFieldPathExists(read, "deletedAt") || accessFieldPathExists(read, "deletedBy"));

    const resolvedShellClassName =
        typeof shellClassName === "function" ? shellClassName(entity) : shellClassName;

    return (
        <EntityCardContext value={contextValue}>
             {/*
              * Only the card surface is swapped for the loader/error view. The dialogs below sit
              * outside this branch on purpose: `extraDialogs` receives `retry`, so a dialog that
              * refreshes the card after mutating it would otherwise unmount itself mid-interaction
              * and lose its form state.
              *
              * No `fetchId` gate here: `useEntityCardFetch` only reports `loading`/`error` once a
              * request is actually enabled (both `fetchId` and `singleUrl` present), so re-checking
              * it would be dead — and it hid the case where `singleUrl` was forgotten, which
              * renders the stub as if it were real.
              */}
            {loading ? (
                <Loader />
            ) : error ? (
                <ErrorView
                    title={failedTitle}
                    description={failedDescription}
                    onClick={retry}
                />
            ) : (
                !sheetOnly && (
                    <AccessFields read={read}>
                        <EntityCardShell
                            ref={shellRef}
                            className={resolvedShellClassName}
                            onClick={() => {
                                if (isDialogDismissGuarded()) return;
                                setAction("view");
                            }}
                        >
                            <div className="flex w-full items-stretch">
                                {showDeleted && (
                                    <DeletedInfo
                                        deletedAt={entity.deletedAt}
                                        deletedBy={entity.deletedBy}
                                    />
                                )}
                                <div className={CARD_CONTENT_CLASS}>
                                    {children({entity, read, setAction, setEntity})}
                                </div>
                            </div>
                        </EntityCardShell>
                    </AccessFields>
                )
            )}

            {!!action && (
                <>
                    {action === "view" &&
                        createElement(Sheet, {
                            open: true,
                            onOpenChange: () => setAction(""),
                            [sheetEntityProp]: entity,
                            onDelete,
                            onRestore,
                            hideActions,
                            ...sheetProps?.({entity, setEntity, setAction}),
                        })}
                    {action === "delete" && !resolvedHideDelete && (
                        <DeleteAction
                            accessModel={resource}
                            deleteId={entity._id}
                            openAlert
                            name={confirmName}
                            confirmName={confirmName}
                            onSuccess={onDelete}
                            onCancel={() => setAction("")}
                            url={deleteUrl}
                        />
                    )}
                    {action === "restore" && !resolvedHideRestore && (
                        <RestoreAction
                            accessModel={resource}
                            deleteId={entity._id}
                            openAlert
                            name={confirmName}
                            confirmName={confirmName}
                            onSuccess={onRestore}
                            onCancel={() => setAction("")}
                            url={restoreUrl}
                        />
                    )}
                    {extraDialogs?.({action, setAction, entity, setEntity, retry})}
                </>
            )}
        </EntityCardContext>
    );
}

/*
 * Rendered as an element, not called as a function: calling it hoisted its hooks into this
 * wrapper's hook list, leaving it without a fiber of its own, so React could never bail out of
 * the card subtree independently and it never appeared in the profiler.
 */
function EntityCard<T extends SoftDeletable>(props: EntityCardProps<T>) {
    return <EntityCardRoot<T> {...props} />;
}

EntityCard.Header = EntityCardHeader;
EntityCard.Body = EntityCardBody;

export default EntityCard;
