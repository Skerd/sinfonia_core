import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {PencilLine} from "lucide-react";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useRef} from "react";

type EditDropdownProps = WithLanguageType & {
    onAction: () => void;
    accessModel: string
}

function EditDropdown({
    resolveLanguageKey,
    onAction,
    accessModel
}: EditDropdownProps) {

    const ref = useRef<HTMLDivElement | null>(null);
    const {write} = useAccess(accessModel);

    const shortCut = "E";
    useKeyboardShortcuts(shortCut, () => {
        if( !!ref.current ){
            ref.current.click();
        }
        else{
            onAction();
        }
    });

    if( !write ) {
        return <HiddenElement />
    }

    return (
        <DropdownMenuItem ref={ref} onClick={() => {onAction()}}>
            <PencilLine size={16}/>
            <p>{resolveLanguageKey("title")}</p>
            <DropdownMenuShortcut>⌘{shortCut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    )
}

export default compose(
    withLanguage("src/modules/core/components/custom/actions/dropdowns/editDropdown.tsx"),
    withDebug(true, true)
)(EditDropdown);
