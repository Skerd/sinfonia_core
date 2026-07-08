import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Calendar, CircleSlash, Lock} from "lucide-react";
import {formatDate} from "@coreModule/helpers/general";
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
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";

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
    timezone = "UTC",
}: MfaDeactivationRequestTabContentProps) {

    const fmt = (d: Date | string | undefined) => d ? formatDate(new Date(d), {timeZone: timezone, format: {dateStyle: "medium", timeStyle: "short"}}) : null;
    const {read} = useAccess("users", !specificUserId ? "self" : "others");

    return (
        <TabsContent value="mfaDeactivation" className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="relative group/mfa-deactivation-row">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <InfoRow
                            icon={CircleSlash}
                            label={resolveLanguageKey("attempts")}
                            tooltip={resolveLanguageKey("attempts")}
                            value={
                                <HiddenElement>
                                    {
                                        read?.requests?.keys?.mfaDeactivation?.keys?.attempts &&
                                        <>
                                            {
                                                mfaDeactivation.attempts != null ?
                                                mfaDeactivation.attempts
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
                            label={resolveLanguageKey("date")}
                            tooltip={resolveLanguageKey("date")}
                            value={
                                <HiddenElement>
                                    {
                                        read?.requests?.keys?.mfaDeactivation?.keys?.date &&
                                        <>
                                            {
                                                mfaDeactivation.date ?
                                                fmt(mfaDeactivation.date)
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
                                        read?.requests?.keys?.mfaDeactivation?.keys?.lockedUntil &&
                                        <>
                                            {
                                                mfaDeactivation.lockedUntil ?
                                                fmt(mfaDeactivation.lockedUntil)
                                                :
                                                <ValueNotSet/>
                                            }
                                        </>
                                    }
                                </HiddenElement>
                            }
                        />

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
