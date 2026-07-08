import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Calendar, CircleSlash, Lock, Mail} from "lucide-react";
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
import ResendActivationAction from "@coreModule/clients/panel/private/users/center/actions/resendActivation.tsx";
import UnlockActivationAction from "@coreModule/clients/panel/private/users/center/actions/unlockActivation.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";

function isActivationLocked(activation: NonNullable<CompanyUserRequestsType["activation"]>): boolean {
    const lockedUntil = activation.lockedUntil;
    if (!lockedUntil) return false;
    return new Date(lockedUntil).getTime() > Date.now();
}

type ActivationRequestTabContentProps = WithLanguageType & {
    activation: NonNullable<CompanyUserRequestsType["activation"]>;
    user: CompanyUserType;
    specificUserId?: string;
    timezone?: string;
};

function ActivationRequestActions({
    activation,
    user,
    specificUserId,
}: Pick<ActivationRequestTabContentProps, "activation" | "user" | "specificUserId">) {

    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");

    const locked = isActivationLocked(activation);
    const showResend = !!write?.requests?.keys?.activation?.keys?.date && !!read?.requests?.keys?.activation?.keys?.lockedUntil && !locked;
    const showUnlock = !!write?.requests?.keys?.activation?.keys?.lockedUntil && locked;

    if (!showResend && !showUnlock) return null;

    return (
        <div className="flex justify-end shrink-0">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-8 rounded-md opacity-0 scale-[0.98] max-md:opacity-100 max-md:scale-100 md:group-hover/activation-row:opacity-100 md:group-hover/activation-row:scale-100 md:group-hover/activation-row:bg-muted/60 md:group-hover/row:opacity-100 md:group-hover/row:scale-100 md:group-hover/row:bg-muted/60 hover:opacity-100 hover:bg-muted/80 hover:scale-100 data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=open]:bg-muted/60 transition-all duration-200 ease-out"
                    >
                        <EllipsisVertical className="size-4"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                    {
                        showResend &&
                        <ResendActivationAction
                            user={user}
                            specificUserId={specificUserId ?? user._id}
                        />
                    }
                    {
                        showUnlock &&
                        <UnlockActivationAction
                            user={user}
                            specificUserId={specificUserId ?? user._id}
                        />
                    }
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

function ActivationRequestTabContentInner({
    activation,
    user,
    specificUserId,
    resolveLanguageKey,
    timezone = "UTC",
}: ActivationRequestTabContentProps) {

    const fmt = (d: Date | string | undefined) => d ? formatDate(new Date(d), {timeZone: timezone, format: {dateStyle: "medium", timeStyle: "short"}}) : null;
    const {read} = useAccess("users", !specificUserId ? "self" : "others");

    return (
        <TabsContent value="activation" className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="relative group/activation-row">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <InfoRow
                            icon={Mail}
                            label={resolveLanguageKey("activationEmail")}
                            tooltip={resolveLanguageKey("activationEmail")}
                            value={
                                <HiddenElement>
                                    {
                                        read?.requests?.keys?.activation?.keys?.email &&
                                        <>
                                            {
                                                activation.email ?
                                                <a className="hover:underline" href={`mailto:${activation.email}`}>{activation.email}</a>
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
                                        read?.requests?.keys?.activation?.keys?.attempts &&
                                        <>
                                            {
                                                activation.attempts != null ?
                                                activation.attempts
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
                                        read?.requests?.keys?.activation?.keys?.date &&
                                        <>
                                            {
                                                activation.date ?
                                                fmt(activation.date)
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
                                        read?.requests?.keys?.activation?.keys?.lockedUntil &&
                                        <>
                                            {
                                                activation.lockedUntil ?
                                                fmt(activation.lockedUntil)
                                                :
                                                <ValueNotSet/>
                                            }
                                        </>
                                    }
                                </HiddenElement>
                            }
                        />

                    </div>

                    <ActivationRequestActions
                        activation={activation}
                        user={user}
                        specificUserId={specificUserId}
                    />
                </div>
            </div>
        </TabsContent>
    );
}

export const ActivationRequestTabContent = compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/cardView/requests/activationRequestTabContent.tsx")
)(ActivationRequestTabContentInner);
