import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {useNavigate} from "react-router-dom";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Building2} from "lucide-react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";

type ViewCitiesProps = WithLanguageType & {
    countryId?: string;
    countryName?: string;
    stateId: string;
    stateName: string;
}

function ViewCities({
    countryId,
    countryName,
    stateId,
    stateName,
    resolveLanguageKey
}: ViewCitiesProps) {

    const {read} = useAccess("cities");
    const navigate = useNavigate();

    if( !read ){
        return <></>
    }
    const shortcut = "1";
    const viewCities = () => {
        const params = new URLSearchParams();
        if (countryId) params.set("countryId", countryId);
        if (countryName) params.set("countryName", countryName);
        params.set("stateId", stateId ?? "");
        if (stateName) params.set("stateName", stateName);
        navigate(`/tenancy/systemSettings/cities?${params.toString()}`);
    }
    useKeyboardShortcuts(shortcut, viewCities);

    return (
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); viewCities(); }}>
            <Building2 size={16}/>
            {resolveLanguageKey("title")}
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/states/center/actions/viewCities.tsx"),
    withDebug(true, true)
)(ViewCities);
