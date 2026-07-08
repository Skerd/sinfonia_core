import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {BadgeCheck, Calendar, CircleSlash, Lock} from "lucide-react";
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
import UnlockPasswordResetAction from "@coreModule/clients/panel/private/users/center/actions/unlockPasswordReset.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";

function isPasswordResetLocked(passwordReset: NonNullable<CompanyUserRequestsType["passwordReset"]>): boolean {
    const lockedUntil = passwordReset.lockedUntil;
    if (!lockedUntil) return false;
    return new Date(lockedUntil).getTime() > Date.now();
}

type PasswordResetRequestTabContentProps = WithLanguageType & {
    passwordReset: NonNullable<CompanyUserRequestsType["passwordReset"]>;
    user: CompanyUserType;
    specificUserId?: string;
    timezone?: string;
};

function PasswordResetRequestActions({
    passwordReset,
    user,
    specificUserId,
}: Pick<PasswordResetRequestTabContentProps, "passwordReset" | "user" | "specificUserId">) {

    const {write} = useAccess("users", !specificUserId ? "self" : "others");

    const locked = isPasswordResetLocked(passwordReset);
    const showUnlock = !!write?.requests?.keys?.passwordReset?.keys?.lockedUntil && locked;

    if (!showUnlock) return null;

    return (
        <div className="flex justify-end shrink-0">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-8 rounded-md opacity-0 scale-[0.98] max-md:opacity-100 max-md:scale-100 md:group-hover/password-reset-row:opacity-100 md:group-hover/password-reset-row:scale-100 md:group-hover/password-reset-row:bg-muted/60 md:group-hover/row:opacity-100 md:group-hover/row:scale-100 md:group-hover/row:bg-muted/60 hover:opacity-100 hover:bg-muted/80 hover:scale-100 data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=open]:bg-muted/60 transition-all duration-200 ease-out"
                    >
                        <EllipsisVertical className="size-4"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                    <UnlockPasswordResetAction
                        user={user}
                        specificUserId={specificUserId ?? user._id}
                    />
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

function PasswordResetRequestTabContentInner({
    passwordReset,
    user,
    specificUserId,
    resolveLanguageKey,
    timezone = "UTC",
}: PasswordResetRequestTabContentProps) {

    const fmt = (d: Date | string | undefined) => d ? formatDate(new Date(d), {timeZone: timezone, format: {dateStyle: "medium", timeStyle: "short"}}) : null;
    const {read} = useAccess("users", !specificUserId ? "self" : "others");

    return (
        <TabsContent value="passwordReset" className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="relative group/password-reset-row">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <InfoRow
                            icon={BadgeCheck}
                            label={resolveLanguageKey("opened")}
                            tooltip={resolveLanguageKey("opened")}
                            value={
                                <HiddenElement>
                                    {
                                        read?.requests?.keys?.passwordReset?.keys?.opened &&
                                        <>
                                            {
                                                passwordReset.opened != null ?
                                                (passwordReset.opened ? resolveLanguageKey("yes") : resolveLanguageKey("no"))
                                                :
                                                <ValueNotSet/>
                                            }
                                        </>
                                    }
                                </HiddenElement>
                            }
                        />

                        <InfoRow
                            icon={CircleSlash}
                            label={resolveLanguageKey("attempts")}
                            tooltip={resolveLanguageKey("attempts")}
                            value={
                                <HiddenElement>
                                    {
                                        read?.requests?.keys?.passwordReset?.keys?.attempts &&
                                        <>
                                            {
                                                passwordReset.attempts != null ?
                                                passwordReset.attempts
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
                                        read?.requests?.keys?.passwordReset?.keys?.date &&
                                        <>
                                            {
                                                passwordReset.date ?
                                                fmt(passwordReset.date)
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
                                        read?.requests?.keys?.passwordReset?.keys?.lockedUntil &&
                                        <>
                                            {
                                                passwordReset.lockedUntil ?
                                                fmt(passwordReset.lockedUntil)
                                                :
                                                <ValueNotSet/>
                                            }
                                        </>
                                    }
                                </HiddenElement>
                            }
                        />

                    </div>

                    <PasswordResetRequestActions
                        passwordReset={passwordReset}
                        user={user}
                        specificUserId={specificUserId}
                    />
                </div>
            </div>
        </TabsContent>
    );
}

export const PasswordResetRequestTabContent = compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/cardView/requests/passwordResetRequestTabContent.tsx")
)(PasswordResetRequestTabContentInner);
