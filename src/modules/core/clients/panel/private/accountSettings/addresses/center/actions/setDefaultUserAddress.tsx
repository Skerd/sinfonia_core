import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {IconStar} from "@tabler/icons-react";
import type {UserAddress} from "armonia/src/modules/core/api/user/private/userAddress/userAddress.dto.ts";

type SetDefaultUserAddressProps = WithLanguageType & {
    entity: Pick<UserAddress, "_id" | "isDefault" | "deletedAt">;
    onAction: (action: string) => void;
};

function SetDefaultUserAddress({entity, resolveLanguageKey, onAction}: SetDefaultUserAddressProps) {
    // Every row of the book is the person's own (D163), so any live, non-default row can become the default.
    if (entity.deletedAt) return null;
    if (entity.isDefault) return null;

    return (
        <DropdownMenuItem onClick={() => onAction("setDefaultUserAddress")}>
            <IconStar className="text-warning" size={16} />
            {resolveLanguageKey("title")}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage(
        "src/modules/core/clients/panel/private/accountSettings/addresses/center/actions/setDefaultUserAddress.tsx",
    ),
    withDebug(true, true, "userAddresses"),
)(SetDefaultUserAddress);
