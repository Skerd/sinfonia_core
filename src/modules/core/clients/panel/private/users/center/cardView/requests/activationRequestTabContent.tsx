import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Calendar, CircleSlash, Lock, Mail} from "lucide-react";
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
import DisplayRow from "@coreModule/components/custom/displayValue/displayRow.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";

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
}: ActivationRequestTabContentProps) {

    const {read} = useAccess("users", !specificUserId ? "self" : "others");
    const activationRead = read?.requests?.keys?.activation?.keys;

    return (
        <TabsContent value="activation" className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="relative group/activation-row">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <InfoRowGroup className="flex-col !gap-y-1.5">
                            <DisplayRow
                                icon={Mail}
                                label={resolveLanguageKey("activationEmail")}
                                tooltip={resolveLanguageKey("activationEmail")}
                                show={!!activationRead?.email}
                                type="email"
                                value={activation.email}
                            />
                            <DisplayRow
                                icon={CircleSlash}
                                label={resolveLanguageKey("attempts")}
                                tooltip={resolveLanguageKey("attempts")}
                                show={!!activationRead?.attempts}
                                type="number"
                                value={activation.attempts}
                            />
                            <DisplayRow
                                icon={Calendar}
                                label={resolveLanguageKey("date")}
                                tooltip={resolveLanguageKey("date")}
                                show={!!activationRead?.date}
                                type="dateTime"
                                value={activation.date}
                            />
                            <DisplayRow
                                icon={Lock}
                                label={resolveLanguageKey("lockedUntil")}
                                tooltip={resolveLanguageKey("lockedUntil")}
                                show={!!activationRead?.lockedUntil}
                                type="dateTime"
                                value={activation.lockedUntil}
                            />
                        </InfoRowGroup>
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
