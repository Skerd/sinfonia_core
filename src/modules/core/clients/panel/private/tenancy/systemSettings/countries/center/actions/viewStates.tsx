import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {useNavigate} from "react-router-dom";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {IconMap} from "@tabler/icons-react";

type ViewStatesProps = WithLanguageType & {
    countryId: string,
    countryName: string,
}

function ViewStates({
    countryId,
    countryName,
    resolveLanguageKey
}: ViewStatesProps) {

    const {read} = useAccess("states");
    const navigate = useNavigate();

    if( !read ){
        return <></>
    }
    const shortcut = "1";
    const viewStates = () => {
        const params = new URLSearchParams();
        params.set("countryId", countryId ?? "");
        if (countryName) params.set("countryName", countryName);
        navigate(`/tenancy/systemSettings/states?${params.toString()}`);
    }
    useKeyboardShortcuts(shortcut, viewStates);

    return (
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); viewStates()}}>
            <IconMap size={16}/>
            {resolveLanguageKey("title")}
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/countries/center/actions/viewStates.tsx"),
    withDebug(true, true)
)(ViewStates);
