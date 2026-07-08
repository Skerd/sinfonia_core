import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {BadgeCheck, Calendar, Clock9, Lock, Mail, UserPlus} from "lucide-react";
import {formatDate, getName} from "@coreModule/helpers/general";
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
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";

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
    timezone = "UTC",
}: InvitationRequestTabContentProps) {

    const fmt = (d: Date | string | undefined) => d ? formatDate(new Date(d), {timeZone: timezone, format: {dateStyle: "medium", timeStyle: "short"}}) : null;
    const {read} = useAccess("users", !specificUserId ? "self" : "others");

    return (
        <TabsContent value="invitation" className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="relative group/invitation-row">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <InfoRow
                            icon={UserPlus}
                            label={resolveLanguageKey("invitedBy")}
                            tooltip={resolveLanguageKey("invitedBy")}
                            value={
                                <HiddenElement>
                                    {
                                        read?.requests?.keys?.invitation?.keys?.invitedBy &&
                                        <>
                                            {
                                                invitation.invitedBy ?
                                                getName(invitation.invitedBy as Parameters<typeof getName>[0])
                                                :
                                                <ValueNotSet/>
                                            }
                                        </>
                                    }
                                </HiddenElement>
                            }
                        />

                        <InfoRow
                            icon={Calendar}
                            label={resolveLanguageKey("invitedAt")}
                            tooltip={resolveLanguageKey("invitedAt")}
                            value={
                                <HiddenElement>
                                    {
                                        read?.requests?.keys?.invitation?.keys?.invitedAt &&
                                        <>
                                            {
                                                invitation.invitedAt ?
                                                fmt(invitation.invitedAt)
                                                :
                                                <ValueNotSet/>
                                            }
                                        </>
                                    }
                                </HiddenElement>
                            }
                        />

                        <InfoRow
                            icon={Mail}
                            label={resolveLanguageKey("opened")}
                            tooltip={resolveLanguageKey("opened")}
                            value={
                                <HiddenElement>
                                    {
                                        read?.requests?.keys?.invitation?.keys?.opened &&
                                        <>
                                            {
                                                invitation.opened !== undefined ?
                                                resolveLanguageKey(invitation.opened ? "yes" : "no")
                                                :
                                                <ValueNotSet/>
                                            }
                                        </>
                                    }
                                </HiddenElement>
                            }
                        />

                        <InfoRow
                            icon={Calendar}
                            label={resolveLanguageKey("attempts")}
                            tooltip={resolveLanguageKey("attempts")}
                            value={
                                <HiddenElement>
                                    {
                                        read?.requests?.keys?.invitation?.keys?.attempts &&
                                        <>
                                            {
                                                invitation.attempts !== undefined ?
                                                invitation.attempts
                                                :
                                                <ValueNotSet/>
                                            }
                                        </>
                                    }
                                </HiddenElement>
                            }
                        />

                        <InfoRow
                            icon={Clock9}
                            label={resolveLanguageKey("invitationExpiresAt")}
                            tooltip={resolveLanguageKey("invitationExpiresAt")}
                            value={
                                <HiddenElement>
                                    {
                                        read?.requests?.keys?.invitation?.keys?.invitationExpiresAt &&
                                        <>
                                            {
                                                invitation.invitationExpiresAt ?
                                                fmt(invitation.invitationExpiresAt)
                                                :
                                                <ValueNotSet/>
                                            }
                                        </>
                                    }
                                </HiddenElement>
                            }
                        />

                        <InfoRow
                            icon={BadgeCheck}
                            label={resolveLanguageKey("accepted")}
                            tooltip={resolveLanguageKey("accepted")}
                            value={
                                <HiddenElement>
                                    {
                                        read?.requests?.keys?.invitation?.keys?.accepted &&
                                        <>
                                            {
                                                invitation.accepted != null ?
                                                (invitation.accepted ? resolveLanguageKey("yes") : resolveLanguageKey("no"))
                                                :
                                                <ValueNotSet/>
                                            }
                                        </>
                                    }
                                </HiddenElement>
                            }
                        />

                        <InfoRow
                            icon={Calendar}
                            label={resolveLanguageKey("acceptedAt")}
                            tooltip={resolveLanguageKey("acceptedAt")}
                            value={
                                <HiddenElement>
                                    {
                                        read?.requests?.keys?.invitation?.keys?.acceptedAt &&
                                        <>
                                            {
                                                invitation.acceptedAt ?
                                                fmt(invitation.acceptedAt)
                                                :
                                                <ValueNotSet/>
                                            }
                                        </>
                                    }
                                </HiddenElement>
                            }
                        />

                        <InfoRow
                            icon={Lock}
                            label={resolveLanguageKey("lockedUntil")}
                            tooltip={resolveLanguageKey("lockedUntil")}
                            value={
                                <HiddenElement>
                                    {
                                        read?.requests?.keys?.invitation?.keys?.lockedUntil &&
                                        <>
                                            {
                                                invitation.lockedUntil ?
                                                fmt(invitation.lockedUntil)
                                                :
                                                <ValueNotSet/>
                                            }
                                        </>
                                    }
                                </HiddenElement>
                            }
                        />

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
