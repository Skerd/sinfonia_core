import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Trash2} from "lucide-react";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useRef} from "react";

type DeleteDropdownProps = WithLanguageType & {
    onAction: (action: string) => void;
    accessModel: string
}

function DeleteDropdown({
    resolveLanguageKey,
    onAction,
    accessModel
}: DeleteDropdownProps) {

    const actionKey = "delete";
    const ref = useRef<HTMLDivElement | null>(null);
    const {delete: deleteModel} = useAccess(accessModel);

    useKeyboardShortcuts("Backspace", () => {
        if( !!ref.current ){
            ref.current.click();
        }
        else{
            onAction(actionKey);
        }
    });

    if( !deleteModel ) {
        return <HiddenElement />
    }

    return (
        <DropdownMenuItem ref={ref} onClick={() => {onAction(actionKey)}}>
            <Trash2 className="text-destructive" size={16}/>
            <p className="text-destructive">
                {resolveLanguageKey("title")}
            </p>
            <DropdownMenuShortcut className="text-destructive">⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
    )
}

export default compose(
    withLanguage("src/modules/core/components/custom/actions/dropdowns/deleteDropdown.tsx"),
    withDebug(true, true)
)(DeleteDropdown);
