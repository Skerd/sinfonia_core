import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {PencilLine} from "lucide-react";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import ActionDropdownItem from "@coreModule/components/viewEngine/widgets/actions/dropdowns/actionDropdownItem.tsx";

type EditDropdownProps = WithLanguageType & {
    /** Edit navigates rather than dispatching an action key, so this takes no argument. */
    onAction: () => void;
    accessModel: string;
};

function EditDropdown({resolveLanguageKey, onAction, accessModel}: EditDropdownProps) {
    const {write} = useAccess(accessModel);
    return (
        <ActionDropdownItem
            label={resolveLanguageKey("title")}
            Icon={PencilLine}
            shortcutKey="E"
            shortcutLabel="E"
            allowed={!!write}
            onSelect={onAction}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/actions/dropdowns/editDropdown.tsx"),
    withDebug(true, true)
)(EditDropdown);
