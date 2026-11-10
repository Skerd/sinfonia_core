import {IconChevronDown, IconChevronUp} from "@tabler/icons-react";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {CompanyRole as CompanyRoleType} from "armonia/src/modules/core/api/company/private/roles/role.dto.ts";
import {CardContent} from "@coreModule/components/ui/card.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import PermissionsTable from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/permissionsTable.tsx";
import React, {useState} from "react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Collapsible, CollapsibleContent} from "@coreModule/components/ui/collapsible.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import RoleSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/center/sheetView/roleSheetView.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {RefObject} from "react";
import {translateDefaultRole} from "@coreModule/helpers/moduleContributions/loadRolesPermissionsContributions.ts";

/** `roleName` only titles the edit page, so it carries the translated name; the form edits the stored one. */
function roleEditPath(role: CompanyRoleType, languageCode: string) {
    const params = new URLSearchParams();
    params.set("roleId", role._id);
    const {name} = translateDefaultRole(role, languageCode);
    if (name) params.set("roleName", name);
    return `/tenancy/systemSettings/roles/edit?${params.toString()}`;
}

type RoleCardProps = WithLanguageType & {
    role: CompanyRoleType;
    fetchId?: string;
    hideActions?: boolean;
    onDelete?: (deletedRole?: CompanyRoleType, response?: DeletedData) => void;
    onRestore?: () => void;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<CompanyRoleType> | null>;
};

const RoleCard = React.memo(function RoleCard({
    role,
    resolveLanguageKey,
    languageCode,
    fetchId,
    hideActions,
    onDelete,
    onRestore,
    sheetOnly = false,
    innerRef,
}: RoleCardProps) {
    const [open, setOpen] = useState(false);

    return (
        <EntityCard
            resource="roles"
            entity={role}
            fetchId={fetchId}
            singleUrl="/api/company/roles/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            sheetOnly={sheetOnly}
            editPath={(row) => roleEditPath(row, languageCode)}
            Sheet={RoleSheetView}
            sheetEntityProp="role"
            deleteUrl="/api/company/roles"
            restoreUrl="/api/company/roles/restore"
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath="name"
            innerRef={innerRef}
            hideEdit={(row) => !row.canEdit}
            hideDelete={(row) => !row.canDelete}
            shellClassName="bg-muted/50"
            sheetProps={() => ({fetchId})}
        >
            {({entity: row, read}) => {
                const canReadPermissions = accessFieldPathExists(read, "permissions");
                const canReadDescription = accessFieldPathExists(read, "description");
                const {name, description} = translateDefaultRole(row, languageCode);
                const permissionsTable =
                    row.permissions && canReadPermissions
                        ? <PermissionsTable permissions={row.permissions} />
                        : undefined;
                return (
                    <>
                        <div className="flex items-start gap-1">
                            <div className="min-w-0 flex-1">
                                <EntityCard.Header
                                    titlePath="name"
                                    title={name ? name : <ValueNotSet />}
                                />
                                {canReadDescription && !!description && (
                                    <HiddenElement>
                                        <p className="mt-1 text-sm leading-snug text-muted-foreground">
                                            {description}
                                        </p>
                                    </HiddenElement>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                className="mt-0.5 shrink-0"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpen((prev) => !prev);
                                }}
                            >
                                {open ? <IconChevronUp /> : <IconChevronDown />}
                            </Button>
                        </div>
                        <Collapsible open={open} onOpenChange={setOpen} className="w-full">
                            <CollapsibleContent
                                className="p-0"
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <CardContent className="flex flex-col gap-y-2 px-2 pb-2 pt-0 text-sm">
                                    <HiddenElement>
                                        {canReadPermissions && permissionsTable}
                                    </HiddenElement>
                                </CardContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </>
                );
            }}
        </EntityCard>
    );
});

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/roles/center/cardView/roleCard.tsx"),
    withDebug(true, true, "roles")
)(RoleCard);
