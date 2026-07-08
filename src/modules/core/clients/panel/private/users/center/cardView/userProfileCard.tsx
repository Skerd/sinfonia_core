import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {
    Ampersand,
    BadgeAlert,
    BadgeCheck,
    Calendar,
    CircleSlash,
    Clock9,
    Key,
    Lock,
    MailCheck,
    Phone,
    Shield,
    ShieldBan,
    ShieldCheck,
    ShieldQuestionMark,
    UserPlus,
} from "lucide-react";
import {Card} from "@coreModule/components/ui/card.tsx";
import CoverPhoto
    from "@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateCoverPhoto/coverPhoto.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ProfilePhoto
    from "@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateProfilePhoto/profilePhoto.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {formatDate, getName} from "@coreModule/helpers/general";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import type {
    CompanyUserRequestsType,
    CompanyUserType
} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import LongText from "@coreModule/components/custom/longText.tsx";
import {Tabs, TabsList, TabsTrigger} from "@coreModule/components/ui/tabs.tsx";
import {ActivationRequestTabContent} from "@coreModule/clients/panel/private/users/center/cardView/requests/activationRequestTabContent.tsx";
import {InvitationRequestTabContent} from "@coreModule/clients/panel/private/users/center/cardView/requests/invitationRequestTabContent.tsx";
import {MfaDeactivationRequestTabContent} from "@coreModule/clients/panel/private/users/center/cardView/requests/mfaDeactivationRequestTabContent.tsx";
import {PasswordResetRequestTabContent} from "@coreModule/clients/panel/private/users/center/cardView/requests/passwordResetRequestTabContent.tsx";
import {useState} from "react";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import {TabsContent} from "@radix-ui/react-tabs";

export type UserProfileData = CompanyUserType;

type UserProfileCardProps = WithLanguageType & {
    data: UserProfileData;
    specificUserId?: string;
};

export function hasRequestsData(req: CompanyUserRequestsType): boolean {
    return !!(
        (req.invitation && (req.invitation.invitedAt || req.invitation.invitedBy || req.invitation.opened != null)) ||
        (req.activation && (req.activation.email || req.activation.attempts != null)) ||
        (req.passwordReset && (req.passwordReset.opened != null || req.passwordReset.attempts != null)) ||
        (req.mfaDeactivation && (req.mfaDeactivation.opened != null || req.mfaDeactivation.attempts != null))
    );
}

type RequestsSectionProps = {
    data: UserProfileData;
    resolveLanguageKey: (key: string) => string;
    timezone?: string;
    specificUserId?: string;
};

const REQUEST_TAB_IDS = ["invitation", "activation", "passwordReset", "mfaDeactivation"] as const;

export function RequestsSection({data, resolveLanguageKey, timezone, specificUserId}: RequestsSectionProps) {
    const [selectedTab, setSelectedTab] = useState("");
    const req = data.requests!;
    const tz = timezone ?? "UTC";

    const tabsWithData = REQUEST_TAB_IDS.filter((id) => {
        const r = req[id as keyof typeof req] as Record<string, unknown> | undefined;
        if (!r) return false;
        if (id === "invitation") return !!(r.invitedAt ?? r.invitedBy);
        if (id === "activation") return !!(r.email ?? (r.attempts != null));
        if (id === "passwordReset") return r.opened != null || r.attempts != null;
        if (id === "mfaDeactivation") return r.opened != null || r.attempts != null;
        return false;
    });

    const tabLabels: Record<(typeof REQUEST_TAB_IDS)[number], string> = {
        invitation: resolveLanguageKey("requestsInvitation"),
        activation: resolveLanguageKey("requestsActivation"),
        passwordReset: resolveLanguageKey("requestsPasswordReset"),
        mfaDeactivation: resolveLanguageKey("requestsMfaDeactivation"),
    };

    return (
        <div className="my-4 overflow-visible" style={{border: "0px solid red"}}>
            <Tabs value={selectedTab} className="mt-2">
                <TabsList variant="line" className="w-full justify-start gap-1 border-b bg-transparent p-0 max-w-full overflow-x-auto overflow-y-hidden">
                    {
                        tabsWithData.map((id) => (
                            <TabsTrigger
                                key={id}
                                value={id}
                                className="justify-start w-fit rounded-none border-b-2 p-0 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation()
                                    if (selectedTab === id) {
                                        setSelectedTab("");
                                    }
                                    else{
                                        setSelectedTab(id)
                                    }
                                }}
                            >
                                {tabLabels[id]}
                            </TabsTrigger>
                        ))
                    }
                </TabsList>
                {
                    req.invitation &&
                    <InvitationRequestTabContent
                        invitation={req.invitation}
                        user={data}
                        specificUserId={specificUserId}
                        timezone={tz}
                    />
                }
                {
                    req.activation && (req.activation.email || req.activation.attempts != null) &&
                    <ActivationRequestTabContent
                        activation={req.activation}
                        user={data}
                        specificUserId={specificUserId}
                        timezone={tz}
                    />
                }
                {
                    req.passwordReset && (req.passwordReset.opened != null || req.passwordReset.attempts != null) &&
                    <PasswordResetRequestTabContent
                        passwordReset={req.passwordReset}
                        user={data}
                        specificUserId={specificUserId}
                        timezone={tz}
                    />
                }
                {
                    req.mfaDeactivation && (req.mfaDeactivation.opened != null || req.mfaDeactivation.attempts != null) &&
                    <MfaDeactivationRequestTabContent
                        mfaDeactivation={req.mfaDeactivation}
                        user={data}
                        specificUserId={specificUserId}
                        timezone={tz}
                    />
                }
            </Tabs>
        </div>
    );
}

function UserProfileCardInner({
    data,
    resolveLanguageKey,
    specificUserId,
}: UserProfileCardProps) {

    const bannerSize = "150px";
    const avatarSize = "120px";
    const {read} = useAccess("users", !specificUserId ? "self" : "others");
    const {timezone} = useSelector((state: RootState) => state.authentication.user);

    if (!read || !Object.keys(read).length) {
        return <HiddenElement/>;
    }

    const tabLabels = {
        ...(
            !!( read.username || read.phoneNumber || read.timezone || read.isEmailVerified || read.emailVerifiedAt || read.roles?.keys?.active || !!read?.requests?.keys?.activation?.keys?.email) &&
            !!( data.username || data.phoneNumber || data.timezone || data.verified || data.emailVerifiedAt || data.status)
            ?
            {
                about: resolveLanguageKey("about")
            }
            :
            {}
        ),
        ...(
            !!( read.registerDate || read.registeredFrom || read.birthday || read.roles?.keys?.lastLogin || read.roles?.keys?.unsuccessfulLogins || read.roles?.keys?.lockedOutUntil ) &&
            !!( data.registerDate || data.registeredFrom || data.birthday || data.lastLogin || data.unsuccessfulLogins || data.lockedOutUntil )
            ?
            {
                info: resolveLanguageKey("info")
            }
            :
            {}
        ),
        ...(
            !!( read.requests?.keys?.invitation?.keys?.invitedBy || read.requests?.keys?.invitation?.keys?.invitedAt || read.requests?.keys?.invitation?.keys?.opened || read.requests?.keys?.invitation?.keys?.attempts || read.requests?.keys?.invitation?.keys?.invitationExpiresAt || read.requests?.keys?.invitation?.keys?.accepted || read.requests?.keys?.invitation?.keys?.acceptedAt || read.requests?.keys?.invitation?.keys?.lockedUntil ) &&
            !!( data.requests?.invitation )
            ?
            {
                invitation: resolveLanguageKey("requestsInvitation")
            }
            :
            {}
        ),
        ...(
            !!( read?.requests?.keys?.activation?.keys?.email || read?.requests?.keys?.activation?.keys?.attempts || read?.requests?.keys?.activation?.keys?.date || read?.requests?.keys?.activation?.keys?.lockedUntil) &&
            !!( data.requests?.activation )
            ?
            {
                activation: resolveLanguageKey("requestsActivation")
            }
            :
            {}
        ),
        ...(
            !!( read?.requests?.keys?.passwordReset?.keys?.opened || read?.requests?.keys?.passwordReset?.keys?.attempts || read?.requests?.keys?.passwordReset?.keys?.date || read?.requests?.keys?.passwordReset?.keys?.lockedUntil) &&
            !!( data.requests?.passwordReset )
            ?
            {
                passwordReset: resolveLanguageKey("requestsPasswordReset")
            }
            :
            {}
        ),
        ...(
            !!( read?.requests?.keys?.mfaDeactivation?.keys?.attempts || read?.requests?.keys?.mfaDeactivation?.keys?.date || read?.requests?.keys?.mfaDeactivation?.keys?.lockedUntil) &&
            !!( data.requests?.mfaDeactivation )
            ?
            {
                mfaDeactivation: resolveLanguageKey("requestsMfaDeactivation")
            }
            :
            {}
        )
    };

    return (
        <div>
            <Card className="p-0 gap-6 transition-all duration-300 hover:shadow-md">

                <HiddenElement>
                    {
                        (read.photo || read.cover) &&
                        <div className="relative p-0 rounded-ee-none gap-0 rounded-es-none mb-2 border"
                             style={{height: bannerSize}}>
                            <CoverPhoto
                                key={`cover-${data._id}-${data.cover ?? ""}`}
                                specificUserId={data._id}
                                hideCondition={!read.cover}
                            />
                            <div
                                className="flex items-center justify-center bg-gray-400 border-4 border-white absolute bottom-[-25px] left-8 rounded-full"
                                style={{width: avatarSize, height: avatarSize}}>
                                <div className="w-full h-full rounded-full">
                                    <ProfilePhoto
                                        key={`photo-${data._id}-${data.photo ?? ""}`}
                                        specificUserId={data._id}
                                        hideCondition={!read.photo}
                                    />
                                </div>
                            </div>
                        </div>
                    }
                </HiddenElement>

                <div className="px-4 space-y-2">
                    <HiddenElement>
                        {
                            (read.name || read.surname || read.online || read.mfaStatus) &&
                            <div className="flex flex-wrap items-center gap-2">
                                {
                                    (read.name || read.surname) &&
                                    <h3 className="text-xl font-bold capitalize">{getName(data)}</h3>
                                }
                                {
                                    (read.online || read.mfaStatus) &&
                                    <div className="flex items-center gap-1.5">
                                        {
                                            read.online &&
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-xs font-normal",
                                                    data.online ? "border-green-500/50 text-green-600" : "border-muted text-muted-foreground"
                                                )}
                                            >
                                                <span className={cn("mr-1 size-1.5 rounded-full", data.online ? "bg-green-500" : "bg-muted-foreground")}/>
                                                {data.online ? resolveLanguageKey("online") : resolveLanguageKey("offline")}
                                            </Badge>
                                        }
                                        {
                                            read.mfaStatus && data.mfaStatus &&
                                            <TooltipDisplayer tooltip={resolveLanguageKey(`mfaStatuses.${data.mfaStatus}`)}>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-xs font-normal", {
                                                        "border-red-500/50 text-red-500": data.mfaStatus === "notActive",
                                                        "border-green-500/50 text-green-500": data.mfaStatus === "active",
                                                    })}
                                                >
                                                    <Shield size={12} className={cn("mr-1")}/>
                                                    {resolveLanguageKey(`mfaStatuses.${data.mfaStatus}`)}
                                                </Badge>
                                            </TooltipDisplayer>
                                        }
                                    </div>
                                }
                            </div>
                        }
                    </HiddenElement>

                    <Tabs defaultValue="about" className="w-full max-w-full pb-2">
                        <TabsList className="overflow-x-auto overflow-y-hidden">
                            {
                                Object.entries(tabLabels).map((value) => {
                                    return (
                                        <TabsTrigger className="text-sm" value={value[0]}>{value[1]}</TabsTrigger>
                                    )
                                })
                            }
                        </TabsList>

                        <TabsContent value="about" className="rounded-md border bg-muted/30 p-3 text-sm">
                            <div className="space-y-1.5">
                                <InfoRow
                                    iconReplacement={<div>
                                        <HiddenElement>
                                            {
                                                (read.isEmailVerified && read?.requests?.keys?.activation?.keys?.email) &&
                                                <>
                                                    {
                                                        (data.verified && !data.unverifiedEmail) ?
                                                        <BadgeCheck size={20} className="text-blue-500"/>
                                                        :
                                                        <BadgeAlert size={20} className="text-red-500"/>
                                                    }
                                                </>
                                            }
                                        </HiddenElement>
                                    </div>}
                                    label={resolveLanguageKey("email")}
                                    tooltipRender={ () =>
                                        <>
                                            <HiddenElement>
                                                {
                                                    !!( read?.roles?.keys?.active && read.username && read?.requests?.keys?.activation?.keys?.email ) &&
                                                    <>
                                                        {
                                                            data.status === "invited" ?
                                                            <p>{resolveLanguageKey("invitedUser")}: <span className="font-semibold">{data.username || data.unverifiedEmail || ""}</span></p>
                                                            :
                                                            (data.verified && !data.unverifiedEmail) ?
                                                            <p>{resolveLanguageKey("emailVerified")}: <span className="font-semibold">{data.username}</span></p>
                                                            :
                                                            <div>
                                                                {
                                                                    !data?.requests?.activation &&
                                                                    <p>{resolveLanguageKey("emailVerified")}: <span className="font-semibold">{data.username}</span></p>
                                                                }
                                                                <p>{resolveLanguageKey("emailNotVerified")}: <span className="font-semibold">{data.unverifiedEmail}</span></p>
                                                            </div>
                                                        }
                                                    </>
                                                }
                                            </HiddenElement>

                                        </>
                                    }
                                    value={
                                        <HiddenElement>
                                            {
                                                read?.username &&
                                                <>
                                                    {
                                                        !!(data.username || data.unverifiedEmail) ?
                                                            <LongText className="max-w-full">
                                                                <a className="hover:underline" href={`mailto:${data.username || data.unverifiedEmail}`}>{data.username || data.unverifiedEmail}</a>
                                                            </LongText>
                                                            :
                                                            <ValueNotSet/>
                                                    }
                                                </>
                                            }
                                        </HiddenElement>
                                    }
                                />

                                <InfoRow
                                    icon={Phone}
                                    label={resolveLanguageKey("phoneNumber")}
                                    tooltip={resolveLanguageKey("phoneNumber")}
                                    value={
                                        <HiddenElement>
                                            {
                                                read.phoneNumber &&
                                                <>
                                                    {
                                                        !!data.phoneNumber ?
                                                        <a className="hover:underline" href={`tel:${data.phoneNumber}`}>{data.phoneNumber}</a>
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
                                    label={resolveLanguageKey("timezone")}
                                    tooltip={resolveLanguageKey("timezone")}
                                    value={
                                        <HiddenElement>
                                            {
                                                read.timezone &&
                                                <>
                                                    {
                                                        !!data.timezone ?
                                                        data.timezone
                                                        :
                                                        <ValueNotSet/>
                                                    }
                                                </>
                                            }
                                        </HiddenElement>
                                    }
                                />
                                <InfoRow
                                    icon={MailCheck}
                                    label={resolveLanguageKey("emailVerifiedAt")}
                                    tooltip={resolveLanguageKey("emailVerifiedAt")}
                                    value={
                                        <HiddenElement>
                                            {
                                                read.emailVerifiedAt &&
                                                <>
                                                    {
                                                        data.emailVerifiedAt ?
                                                        formatDate(new Date(data.emailVerifiedAt), {timeZone: timezone ?? "UTC", format: {dateStyle: "long", timeStyle: "short"}})
                                                        :
                                                        <ValueNotSet/>
                                                    }
                                                </>
                                            }
                                        </HiddenElement>
                                    }
                                />
                                <InfoRow
                                    iconReplacement={
                                        <HiddenElement>
                                            {
                                                read.roles?.keys?.active &&
                                                <div>
                                                    {
                                                        !!data.status &&
                                                        <>
                                                            {
                                                                data.status === "active" &&
                                                                <ShieldCheck size={18} className="text-green-600"/>
                                                            }
                                                            {
                                                                data.status === "inactive" &&
                                                                <ShieldBan size={18} className="text-destructive"/>
                                                            }
                                                            {
                                                                data.status === "invited" &&
                                                                <ShieldQuestionMark size={18} className="text-sky-300"/>
                                                            }
                                                        </>
                                                    }
                                                </div>
                                            }
                                        </HiddenElement>
                                    }
                                    label={resolveLanguageKey("status")}
                                    tooltip={resolveLanguageKey("status")}
                                    value={
                                        <HiddenElement>
                                            {
                                                read.roles?.keys?.active && !!data.status &&
                                                <>
                                                    <span className={cn("hover:underline", {
                                                        "text-green-600": data.status === "active",
                                                        "text-destructive": data.status === "inactive",
                                                        "text-sky-300": data.status === "invited"
                                                    })}>
                                                        {resolveLanguageKey(`statuses.${data.status}`)}
                                                    </span>
                                                </>
                                            }
                                        </HiddenElement>
                                    }
                                />
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">{resolveLanguageKey("roles")}</p>
                                    <HiddenElement>
                                        {
                                            read?.roles?.keys?.roles?.keys?.name &&
                                            <div className="flex items-center flex-wrap space-x-1 space-y-0.5">
                                                {
                                                    data.roles?.map((r, i: number) => {
                                                        return (
                                                            <Badge key={i} variant="outline" className="capitalize">
                                                                {r.name}
                                                            </Badge>
                                                        )
                                                    })
                                                }
                                            </div>
                                        }
                                    </HiddenElement>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="info" className="rounded-md border bg-muted/30 p-3 text-sm">
                            <div className="space-y-1.5">
                                <InfoRow
                                    icon={Ampersand}
                                    label={resolveLanguageKey("registeredDate")}
                                    tooltip={resolveLanguageKey("registeredDate")}
                                    value={
                                        <HiddenElement>
                                            {
                                                read.registerDate &&
                                                <>
                                                    {
                                                        !!data.registerDate ?
                                                        formatDate(new Date(data.registerDate), {timeZone: timezone ?? "UTC", format: {dateStyle: "long", timeStyle: "short"}})
                                                        :
                                                        <ValueNotSet/>
                                                    }
                                                </>
                                            }
                                        </HiddenElement>
                                    }
                                />
                                <InfoRow
                                    icon={UserPlus}
                                    label={resolveLanguageKey("registeredFrom")}
                                    tooltip={resolveLanguageKey("registeredFrom")}
                                    value={
                                        <HiddenElement>
                                            {
                                                read.registeredFrom &&
                                                <>
                                                    {
                                                        data.registeredFrom ?
                                                        getName(data.registeredFrom as Parameters<typeof getName>[0])
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
                                    label={resolveLanguageKey("birthday")}
                                    tooltip={resolveLanguageKey("birthday")}
                                    value={
                                        <HiddenElement>
                                            {
                                                read.birthday &&
                                                <>
                                                    {
                                                        !!data.birthday ?
                                                        formatDate(new Date(data.birthday), {timeZone: timezone ?? "UTC", format: {dateStyle: "long"}})
                                                        :
                                                        <ValueNotSet/>
                                                    }
                                                </>
                                            }
                                        </HiddenElement>
                                    }
                                />
                                <InfoRow
                                    icon={Key}
                                    label={resolveLanguageKey("lastLoginDate")}
                                    tooltip={resolveLanguageKey("lastLoginDate")}
                                    value={
                                        <HiddenElement>
                                            {
                                                read.roles?.keys?.lastLogin &&
                                                <>
                                                    {
                                                        data.lastLogin ?
                                                        formatDate(new Date(data.lastLogin), {timeZone: timezone ?? "UTC", format: {dateStyle: "long", timeStyle: "medium"}})
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
                                    label={resolveLanguageKey("unsuccessfulLogins")}
                                    tooltip={resolveLanguageKey("unsuccessfulLogins")}
                                    value={
                                        <HiddenElement>
                                            {
                                                read.roles?.keys?.unsuccessfulLogins &&
                                                <>
                                                    {
                                                        data.unsuccessfulLogins !== undefined ?
                                                        data.unsuccessfulLogins
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
                                    label={resolveLanguageKey("lockedOutUntil")}
                                    tooltip={resolveLanguageKey("lockedOutUntil")}
                                    value={
                                        <HiddenElement>
                                            {
                                                read.roles?.keys?.lockedOutUntil &&
                                                <>
                                                    {
                                                        data.lockedOutUntil ?
                                                        formatDate(new Date(data.lockedOutUntil), {timeZone: timezone ?? "UTC", format: {dateStyle: "long", timeStyle: "short"}})
                                                        :
                                                        <ValueNotSet/>
                                                    }
                                                </>
                                            }
                                        </HiddenElement>
                                    }
                                />
                            </div>
                        </TabsContent>
                        {
                            data?.requests?.invitation &&
                            <InvitationRequestTabContent
                                invitation={data.requests.invitation}
                                user={data}
                                specificUserId={specificUserId}
                                timezone={timezone}
                            />
                        }
                        {
                            data?.requests?.activation &&
                            <ActivationRequestTabContent
                                activation={data.requests.activation}
                                user={data}
                                specificUserId={specificUserId}
                                timezone={timezone}
                            />
                        }
                        {
                            data?.requests?.passwordReset &&
                            <PasswordResetRequestTabContent
                                passwordReset={data.requests.passwordReset}
                                user={data}
                                specificUserId={specificUserId}
                                timezone={timezone}
                            />
                        }
                        {
                            data?.requests?.mfaDeactivation &&
                            <MfaDeactivationRequestTabContent
                                mfaDeactivation={data.requests.mfaDeactivation}
                                user={data}
                                specificUserId={specificUserId}
                                timezone={timezone}
                            />
                        }
                    </Tabs>
                </div>
            </Card>
        </div>
    );
}

const UserProfileCard = compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/cardView/userProfileCard.tsx"),
    withDebug(true, true)
)(UserProfileCardInner);

export {UserProfileCard};
export default UserProfileCard;
