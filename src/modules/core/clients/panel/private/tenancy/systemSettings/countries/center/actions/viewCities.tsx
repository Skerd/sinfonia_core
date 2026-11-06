import {IconBuilding} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {useNavigate} from "react-router-dom";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";

type ViewCitiesProps = WithLanguageType & {
    countryId: string,
    countryName: string,
}

function ViewCities({
    countryId,
    countryName,
    resolveLanguageKey
}: ViewCitiesProps) {

    const {read} = useAccess("cities");
    const navigate = useNavigate();

    const shortcut = "2";
    const viewStates = () => {
        const params = new URLSearchParams();
        params.set("countryId", countryId ?? "");
        if (countryName) params.set("countryName", countryName);
        navigate(`/tenancy/systemSettings/cities?${params.toString()}`);
    }
    useKeyboardShortcuts(shortcut, viewStates, {enabled: read});

    if (!read) return null;

    return (
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); viewStates()}}>
            <IconBuilding size={16}/>
            {resolveLanguageKey("title")}
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/countries/center/actions/viewCities.tsx"),
    withDebug(true, true, "cities")
)(ViewCities);
