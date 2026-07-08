import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {RotateCcw} from "lucide-react";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useRef} from "react";

type RestoreDropdownProps = WithLanguageType & {
    onAction: (action: string) => void;
    accessModel: string
}

function RestoreDropdown({
    resolveLanguageKey,
    onAction,
    accessModel
}: RestoreDropdownProps) {

    const actionKey = "restore";
    const ref = useRef<HTMLDivElement | null>(null);
    const {restore} = useAccess(accessModel);

    useKeyboardShortcuts("Enter", () => {
        if( !!ref.current ){
            ref.current.click();
        }
        else{
            onAction(actionKey);
        }
    });

    if( !restore ) {
        return <HiddenElement />
    }

    return (
        <DropdownMenuItem ref={ref} onClick={() => {onAction(actionKey)}}>
            <RotateCcw className="text-green-600" size={16}/>
            <p className="text-green-600">
                {resolveLanguageKey("title")}
            </p>
            <DropdownMenuShortcut className="text-green-600">⌘⏎</DropdownMenuShortcut>
        </DropdownMenuItem>
    )
}

export default compose(
    withLanguage("src/modules/core/components/custom/actions/dropdowns/restoreDropdown.tsx"),
    withDebug(true, true)
)(RestoreDropdown);
