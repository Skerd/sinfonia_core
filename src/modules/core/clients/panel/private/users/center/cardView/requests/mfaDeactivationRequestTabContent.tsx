import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Calendar, CircleSlash, Lock} from "lucide-react";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import type {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";
import type {CompanyUserRequestsType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger
} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {EllipsisVertical} from "lucide-react";
import {TabsContent} from "@coreModule/components/ui/tabs.tsx";
import UnlockMfaDeactivationAction from "@coreModule/clients/panel/private/users/center/actions/unlockMfaDeactivation.tsx";
import DisplayRow from "@coreModule/components/custom/displayValue/displayRow.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";

function isMfaDeactivationLocked(mfaDeactivation: NonNullable<CompanyUserRequestsType["mfaDeactivation"]>): boolean {
    const lockedUntil = mfaDeactivation.lockedUntil;
    if (!lockedUntil) return false;
    return new Date(lockedUntil).getTime() > Date.now();
}

type MfaDeactivationRequestTabContentProps = WithLanguageType & {
    mfaDeactivation: NonNullable<CompanyUserRequestsType["mfaDeactivation"]>;
    user: CompanyUserType;
    specificUserId?: string;
    timezone?: string;
};

function MfaDeactivationRequestActions({
    mfaDeactivation,
    user,
    specificUserId,
}: Pick<MfaDeactivationRequestTabContentProps, "mfaDeactivation" | "user" | "specificUserId">) {

    const {write} = useAccess("users", !specificUserId ? "self" : "others");

    const locked = isMfaDeactivationLocked(mfaDeactivation);
    const showUnlock = !!write?.requests?.keys?.mfaDeactivation?.keys?.lockedUntil && locked;

    if (!showUnlock) return null;

    return (
        <div className="flex justify-end shrink-0">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-8 rounded-md opacity-0 scale-[0.98] max-md:opacity-100 max-md:scale-100 md:group-hover/mfa-deactivation-row:opacity-100 md:group-hover/mfa-deactivation-row:scale-100 md:group-hover/mfa-deactivation-row:bg-muted/60 md:group-hover/row:opacity-100 md:group-hover/row:scale-100 md:group-hover/row:bg-muted/60 hover:opacity-100 hover:bg-muted/80 hover:scale-100 data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=open]:bg-muted/60 transition-all duration-200 ease-out"
                    >
                        <EllipsisVertical className="size-4"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                    <UnlockMfaDeactivationAction
                        user={user}
                        specificUserId={specificUserId ?? user._id}
                    />
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

function MfaDeactivationRequestTabContentInner({
    mfaDeactivation,
    user,
    specificUserId,
    resolveLanguageKey,
}: MfaDeactivationRequestTabContentProps) {

    const {read} = useAccess("users", !specificUserId ? "self" : "others");
    const mfaRead = read?.requests?.keys?.mfaDeactivation?.keys;

    return (
        <TabsContent value="mfaDeactivation" className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="relative group/mfa-deactivation-row">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <InfoRowGroup className="flex-col !gap-y-1.5">
                            <DisplayRow
                                icon={CircleSlash}
                                label={resolveLanguageKey("attempts")}
                                tooltip={resolveLanguageKey("attempts")}
                                show={!!mfaRead?.attempts}
                                type="number"
                                value={mfaDeactivation.attempts}
                            />
                            <DisplayRow
                                icon={Calendar}
                                label={resolveLanguageKey("date")}
                                tooltip={resolveLanguageKey("date")}
                                show={!!mfaRead?.date}
                                type="dateTime"
                                value={mfaDeactivation.date}
                            />
                            <DisplayRow
                                icon={Lock}
                                label={resolveLanguageKey("lockedUntil")}
                                tooltip={resolveLanguageKey("lockedUntil")}
                                show={!!mfaRead?.lockedUntil}
                                type="dateTime"
                                value={mfaDeactivation.lockedUntil}
                            />
                        </InfoRowGroup>
                    </div>

                    <MfaDeactivationRequestActions
                        mfaDeactivation={mfaDeactivation}
                        user={user}
                        specificUserId={specificUserId}
                    />
                </div>
            </div>
        </TabsContent>
    );
}

export const MfaDeactivationRequestTabContent = compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/cardView/requests/mfaDeactivationRequestTabContent.tsx")
)(MfaDeactivationRequestTabContentInner);
