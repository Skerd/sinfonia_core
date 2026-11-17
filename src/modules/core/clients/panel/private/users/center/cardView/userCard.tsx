import {useState, type ComponentType} from "react";
import {compose} from "redux";
import {useSelector} from "react-redux";
import {IconClock} from "@tabler/icons-react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {getName} from "@coreModule/helpers/general/names.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Dialog, DialogContent, DialogTitle} from "@coreModule/components/ui/dialog.tsx";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {STATUS_BADGE_NEUTRAL, STATUS_BADGE_SUCCESS, STATUS_BADGE_WARNING} from "@coreModule/components/entityPage/list/entityCard.constants.ts";
import ProfilePhoto
    from "@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateProfilePhoto/profilePhoto.tsx";
import {translateDefaultRole} from "@coreModule/helpers/moduleContributions/loadRolesPermissionsContributions.ts";
import {UserProfileCard} from "./userProfileCard.tsx";
import UserActions from "@coreModule/clients/panel/private/users/center/actions";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/companyUser.dto.ts";

const STATUS_BADGE: Record<string, string> = {active: STATUS_BADGE_SUCCESS, invited: STATUS_BADGE_WARNING, inactive: STATUS_BADGE_NEUTRAL};
const MAX_ROLES = 3;

type UserCardProps = WithLanguageType & {
    user: CompanyUserType;
    specificUserId?: string;
    /** Opens the edit drawer the users page owns. */
    onEdit: (user: CompanyUserType) => void;
}

/**
 * A person in the users list: photo, name, status and last sign-in badges, and roles (TD-F124: the list showed the whole
 * profile, five or six facts and "Status: Active" as a row). The full profile, with its requests, opens in a dialog.
 */
function UserCard({user, specificUserId, onEdit, resolveLanguageKey, languageCode}: UserCardProps) {
    const {write, read} = useAccess("users", !specificUserId ? "self" : "others");
    const [open, setOpen] = useState(false);
    const name = getName({name: read?.name ? user.name : "", surname: read?.surname ? user.surname : ""});
    const roles = read?.roles?.keys?.roles ? user.roles ?? [] : [];
    const status = read?.roles?.keys?.active ? user.status : undefined;
    const {timezone} = useSelector((state: RootState) => state.authentication.user);
    const lastLogin = read?.roles?.keys?.lastLogin && user.lastLogin
        ? formatDate(user.lastLogin, {timeZone: timezone, format: DATE_FORMATS.mediumDateTime})
        : "";

    return (
        <div className="group relative">
            <Button
                variant="bare"
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <div className="flex min-w-0 items-center gap-3 pe-8">
                    <div className="size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                        {read?.photo ? <ProfilePhoto key={`photo-${user._id}-${user.photo ?? ""}`} specificUserId={user._id} /> : null}
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                        <span className="truncate font-semibold capitalize">{name || user.username}</span>
                        {status || lastLogin ? (
                            <div className="flex flex-wrap items-center gap-1">
                                {status ? (
                                    <Badge variant="outline" className={cn("w-fit text-xs font-normal", STATUS_BADGE[status])}>
                                        {resolveLanguageKey(`statuses.${status}`)}
                                    </Badge>
                                ) : null}
                                {lastLogin ? (
                                    <Badge variant="outline" className="w-fit gap-1 text-xs font-normal text-muted-foreground"
                                        title={String(resolveLanguageKey("lastLoginDate"))}>
                                        <IconClock className="size-3" aria-hidden />
                                        <span className="sr-only">{resolveLanguageKey("lastLoginDate")}:</span>
                                        {lastLogin}
                                    </Badge>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
                {roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {roles.slice(0, MAX_ROLES).map((role) => (
                            <Badge key={role._id} variant="outline" className="capitalize">{translateDefaultRole(role, languageCode).name}</Badge>
                        ))}
                        {roles.length > MAX_ROLES ? <Badge variant="outline" className="text-muted-foreground">+{roles.length - MAX_ROLES}</Badge> : null}
                    </div>
                ) : null}
            </Button>
            {write ? (
                <div className="absolute top-2 right-2 z-10">
                    <UserActions user={user} specificUserId={user._id} onEdit={onEdit} />
                </div>
            ) : null}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
                    <DialogTitle className="sr-only">{name || user.username}</DialogTitle>
                    {open ? <UserProfileCard data={user} specificUserId={user._id} /> : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default compose(
    // The profile card's texts: statuses, roles and last login.
    withLanguage("src/modules/core/clients/panel/private/users/center/cardView/userProfileCard.tsx"),
    withDebug(true, true, "users")
)(UserCard) as ComponentType<Omit<UserCardProps, keyof WithLanguageType>>;
