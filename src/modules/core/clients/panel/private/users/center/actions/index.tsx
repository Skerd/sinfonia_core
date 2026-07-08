import {compose} from "redux";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger
} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {EllipsisVertical} from "lucide-react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import EditUserAction from "@coreModule/clients/panel/private/users/center/actions/edit.tsx";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";

type UserActionsProps = {
    specificUserId?: string;
    user: CompanyUserType;
}

function UserActions({user, specificUserId}: UserActionsProps) {
    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");

    if (!read && !write) return <HiddenElement />;

    return (
        <div className="flex justify-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-8 rounded-md opacity-0 scale-[0.98] max-md:opacity-100 max-md:scale-100 md:group-hover:opacity-100 md:group-hover:scale-100 md:group-hover:bg-muted/60 md:group-hover/row:opacity-100 md:group-hover/row:scale-100 md:group-hover/row:bg-muted/60 hover:opacity-100 hover:bg-muted/80 hover:scale-100 data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=open]:bg-muted/60 transition-all duration-200 ease-out"
                    >
                        <EllipsisVertical className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                    {
                        write &&
                        <>
                            <EditUserAction user={user} specificUserId={user._id}/>
                        </>
                    }
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export default compose(withDebug(true, true))(UserActions);
