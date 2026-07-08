import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Eye} from "lucide-react";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useRef} from "react";

type ViewDropdownProps = WithLanguageType & {
    onAction: (action: string) => void;
    accessModel: string
}

function ViewDropdown({
    resolveLanguageKey,
    onAction,
    accessModel
}: ViewDropdownProps) {

    const actionKey = "view";
    const ref = useRef<HTMLDivElement | null>(null);
    const {read} = useAccess(accessModel);

    const shortCut = "U";
    useKeyboardShortcuts(shortCut, () => {
        if( !!ref.current ){
            ref.current.click();
        }
        else{
            onAction(actionKey);
        }
    });

    if( !read ) {
        return <HiddenElement />
    }

    return (
        <DropdownMenuItem ref={ref} onClick={() => {onAction(actionKey)}}>
            <Eye size={16}/>
            <p>{resolveLanguageKey("title")}</p>
            <DropdownMenuShortcut>⌘{shortCut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    )
}

export default compose(
    withLanguage("src/modules/core/components/custom/actions/dropdowns/viewDropdown.tsx"),
    withDebug(true, true)
)(ViewDropdown);
