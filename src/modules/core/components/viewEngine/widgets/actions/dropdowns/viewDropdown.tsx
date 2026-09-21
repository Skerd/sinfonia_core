import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {Eye} from "lucide-react";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import ActionDropdownItem from "@coreModule/components/viewEngine/widgets/actions/dropdowns/actionDropdownItem.tsx";

type ViewDropdownProps = WithLanguageType & {
    onAction: (action: string) => void;
    accessModel: string;
};

function ViewDropdown({resolveLanguageKey, onAction, accessModel}: ViewDropdownProps) {
    const {read} = useAccess(accessModel);
    return (
        <ActionDropdownItem
            label={resolveLanguageKey("title")}
            Icon={Eye}
            shortcutKey="U"
            shortcutLabel="U"
            allowed={!!read}
            onSelect={() => onAction("view")}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/actions/dropdowns/viewDropdown.tsx"),
    withDebug(true, true)
)(ViewDropdown);
