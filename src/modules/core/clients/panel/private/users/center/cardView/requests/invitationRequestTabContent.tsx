import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {BadgeCheck, Calendar, Clock9, Lock, Mail, MessageSquareText, UserPlus} from "lucide-react";
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
import ResendInvitationAction from "@coreModule/clients/panel/private/users/center/actions/resendInvitation.tsx";
import UnlockInvitationAction from "@coreModule/clients/panel/private/users/center/actions/unlockInvitation.tsx";
import DisplayRow from "@coreModule/components/custom/displayValue/displayRow.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";

function isInvitationLocked(invitation: NonNullable<CompanyUserRequestsType["invitation"]>): boolean {
    const lockedUntil = invitation.lockedUntil;
    if (!lockedUntil) return false;
    return new Date(lockedUntil).getTime() > Date.now();
}

type InvitationRequestTabContentProps = WithLanguageType & {
    invitation: NonNullable<CompanyUserRequestsType["invitation"]>;
    user: CompanyUserType;
    specificUserId?: string;
    timezone?: string;
};

function InvitationRequestActions({
    invitation,
    user,
    specificUserId,
}: Pick<InvitationRequestTabContentProps, "invitation" | "user" | "specificUserId">) {

    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");

    const accepted = invitation.accepted === true;
    const locked = isInvitationLocked(invitation);
    const showResend = !!write?.requests?.keys?.invitation?.keys?.invitationExpiresAt && !!read?.requests?.keys?.invitation?.keys?.lockedUntil && !locked;
    const showUnlock = !!write?.requests?.keys?.invitation?.keys?.lockedUntil && locked;

    if ((!showResend && !showUnlock) || accepted) return null;

    return (
        <div className="flex justify-end shrink-0">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-8 rounded-md opacity-0 scale-[0.98] max-md:opacity-100 max-md:scale-100 md:group-hover/invitation-row:opacity-100 md:group-hover/invitation-row:scale-100 md:group-hover/invitation-row:bg-muted/60 md:group-hover/row:opacity-100 md:group-hover/row:scale-100 md:group-hover/row:bg-muted/60 hover:opacity-100 hover:bg-muted/80 hover:scale-100 data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=open]:bg-muted/60 transition-all duration-200 ease-out"
                    >
                        <EllipsisVertical className="size-4"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                    {
                        showResend &&
                        <ResendInvitationAction
                            user={user}
                            specificUserId={specificUserId ?? user._id}
                        />
                    }
                    {
                        showUnlock &&
                        <UnlockInvitationAction
                            user={user}
                            specificUserId={specificUserId ?? user._id}
                        />
                    }
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

function InvitationRequestTabContentInner({
    invitation,
    user,
    specificUserId,
    resolveLanguageKey,
}: InvitationRequestTabContentProps) {

    const {read} = useAccess("users", !specificUserId ? "self" : "others");
    const invitationRead = read?.requests?.keys?.invitation?.keys;
    const accepted = invitation.accepted === true;

    return (
        <TabsContent value="invitation" className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="relative group/invitation-row">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <InfoRowGroup className="flex-col !gap-y-1.5">
                            <DisplayRow
                                icon={UserPlus}
                                label={resolveLanguageKey("invitedBy")}
                                tooltip={resolveLanguageKey("invitedBy")}
                                show={!!invitationRead?.invitedBy}
                                type="user"
                                value={invitation.invitedBy}
                            />
                            <DisplayRow
                                icon={Calendar}
                                label={resolveLanguageKey("invitedAt")}
                                tooltip={resolveLanguageKey("invitedAt")}
                                show={!!invitationRead?.invitedAt}
                                type="dateTime"
                                value={invitation.invitedAt}
                            />
                            <DisplayRow
                                icon={MessageSquareText}
                                label={resolveLanguageKey("welcomeMessage")}
                                tooltip={resolveLanguageKey("welcomeMessage")}
                                show={!!invitationRead?.welcomeMessage}
                                type="longText"
                                value={invitation.welcomeMessage}
                            />
                            {
                                !accepted &&
                                <>
                                    <DisplayRow
                                        icon={Mail}
                                        label={resolveLanguageKey("opened")}
                                        tooltip={resolveLanguageKey("opened")}
                                        show={!!invitationRead?.opened}
                                        type="boolean"
                                        value={invitation.opened}
                                    />
                                    <DisplayRow
                                        icon={Calendar}
                                        label={resolveLanguageKey("attempts")}
                                        tooltip={resolveLanguageKey("attempts")}
                                        show={!!invitationRead?.attempts}
                                        type="number"
                                        value={invitation.attempts}
                                    />
                                    <DisplayRow
                                        icon={Clock9}
                                        label={resolveLanguageKey("invitationExpiresAt")}
                                        tooltip={resolveLanguageKey("invitationExpiresAt")}
                                        show={!!invitationRead?.invitationExpiresAt}
                                        type="dateTime"
                                        value={invitation.invitationExpiresAt}
                                    />
                                    <DisplayRow
                                        icon={Lock}
                                        label={resolveLanguageKey("lockedUntil")}
                                        tooltip={resolveLanguageKey("lockedUntil")}
                                        show={!accepted && !!invitationRead?.lockedUntil}
                                        type="dateTime"
                                        value={invitation.lockedUntil}
                                    />
                                </>
                            }
                            {
                                accepted &&
                                <>
                                    <DisplayRow
                                        icon={BadgeCheck}
                                        label={resolveLanguageKey("accepted")}
                                        tooltip={resolveLanguageKey("accepted")}
                                        show={!!invitationRead?.accepted}
                                        type="boolean"
                                        value={invitation.accepted}
                                    />
                                    <DisplayRow
                                        icon={Calendar}
                                        label={resolveLanguageKey("acceptedAt")}
                                        tooltip={resolveLanguageKey("acceptedAt")}
                                        show={!!invitationRead?.acceptedAt}
                                        type="dateTime"
                                        value={invitation.acceptedAt}
                                    />
                                </>
                            }
                        </InfoRowGroup>
                    </div>

                    <InvitationRequestActions
                        invitation={invitation}
                        user={user}
                        specificUserId={specificUserId}
                    />
                </div>
            </div>
        </TabsContent>
    );
}

export const InvitationRequestTabContent = compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/cardView/requests/invitationRequestTabContent.tsx")
)(InvitationRequestTabContentInner);
