import {
    createContext,
    createElement,
    useContext,
    useImperativeHandle,
    type ComponentType,
    type ReactNode,
    type RefObject,
} from "react";
import {useAccess, accessFieldPathExists} from "@coreModule/helpers/hocs/withAccess.tsx";
import {useEntityCard} from "@coreModule/helpers/hooks/useEntityCard.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import AccessFields from "@coreModule/components/custom/displayValue/accessFields.tsx";
import DisplayValue from "@coreModule/components/custom/displayValue/displayValue.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import {EntityCardFetchGuard} from "@coreModule/components/custom/cards/EntityCardFetchGuard.tsx";
import {EntityCardShell} from "@coreModule/components/custom/cards/EntityCardShell.tsx";
import {EntityTextCardHeader} from "@coreModule/components/custom/cards/EntityTextCardHeader.tsx";
import {useEntityCardFetch} from "@coreModule/helpers/hooks/useEntityCardFetch.ts";

const CARD_CONTENT_CLASS = "flex w-full min-w-0 flex-col gap-(--density-pad) p-(--density-pad)";

type SoftDeletable = DeletedData & {
    _id: string;
};

/** `read === true` is allow-all. `false`, `{}`, and non-objects deny. */
function hasCardRead(read: unknown): boolean {
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

function getPathValue(source: unknown, path: string): unknown {
    return path.split(".").reduce<unknown>((current, segment) => {
        if (current == null || typeof current !== "object") return undefined;
        return (current as Record<string, unknown>)[segment];
    }, source);
}

export type EntityCardProps<T extends SoftDeletable> = {
    resource: string;
    entity: T;
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
    titlePath?: string;
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
        hideActions,
        hideDelete,
        hideRestore,
        hideEdit,
        setAction,
        editPath,
        titlePath: hostTitlePath,
    } = useEntityCardContext();
    const titlePath = titlePathProp ?? hostTitlePath;
    const hasMenuChildren = children != null && children !== false;

    return (
        <EntityTextCardHeader
            className="p-0"
            iconTile={icon}
            title={<DisplayValue path={titlePath} value={title} show />}
            subtitle={
                subtitle !== undefined ? (
                    <DisplayValue path={subtitlePath} value={subtitle} show />
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
    useEntityCardContext();
    return <InfoRowGroup className={className}>{children}</InfoRowGroup>;
}

function EntityCardRoot<T extends SoftDeletable>({
    resource,
    entity: entityProp,
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

    useImperativeHandle(innerRef, () => ({
        success: (data) => {
            if (data != null) setEntity(data);
        },
    }));

    const {read, restore} = useAccess(resource);
    const isDeleted = !!entity.deletedAt || !!entity.deletedBy;

    if (hideAfterDeletion || (isDeleted && !restore)) {
        return <></>;
    }
    if (!hasCardRead(read)) {
        return <HiddenElement />;
    }

    const titleValue = getPathValue(entity, titlePath);
    const confirmName =
        accessFieldPathExists(read, titlePath) && typeof titleValue === "string" ? titleValue : undefined;
    const showDeleted =
        (!!entity.deletedAt || !!entity.deletedBy) &&
        (accessFieldPathExists(read, "deletedAt") || accessFieldPathExists(read, "deletedBy"));

    const resolvedHideEdit = typeof hideEdit === "function" ? hideEdit(entity) : hideEdit;
    const resolvedHideDelete = typeof hideDelete === "function" ? hideDelete(entity) : hideDelete;
    const resolvedHideRestore = typeof hideRestore === "function" ? hideRestore(entity) : hideRestore;

    const contextValue: EntityCardContextValue = {
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
    };
    const resolvedShellClassName =
        typeof shellClassName === "function" ? shellClassName(entity) : shellClassName;

    return (
        <EntityCardContext value={contextValue}>
            <EntityCardFetchGuard
                fetchId={fetchId}
                loading={loading}
                error={error}
                failedTitle={failedTitle}
                failedDescription={failedDescription}
                onRetry={retry}
            >
                <>
                    {!sheetOnly && (
                        <AccessFields read={read}>
                            <EntityCardShell
                                ref={shellRef}
                                className={resolvedShellClassName}
                                onClick={() => setAction("view")}
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
                </>
            </EntityCardFetchGuard>
        </EntityCardContext>
    );
}

function EntityCard<T extends SoftDeletable>(props: EntityCardProps<T>) {
    return EntityCardRoot(props);
}

EntityCard.Header = EntityCardHeader;
EntityCard.Body = EntityCardBody;

export default EntityCard;
