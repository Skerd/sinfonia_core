import {useMemo, useState} from "react";
import {useSelector} from "react-redux";
import {IconCheck, IconSelector} from "@tabler/icons-react";
import type {BasicCompanyInfoFormResponseType} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import type {TableResponse} from "armonia/src/modules/core/types/shared.types.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@coreModule/components/ui/dropdown-menu.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {useRelogin} from "@coreModule/helpers/hooks/useRelogin.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";

const COMPANIES_REQUEST = {method: "post" as const, url: "/api/companies/basicInfo", data: {}};
const COMPANIES_BODY = {offset: 0, limit: 50};

/**
 * Same company switch as the panel sidebar: `POST /api/user/login/differentCompany`.
 * Studio stays on the open view; the new session's company is what sample rows load.
 */
export default function StudioCompanySwitcher() {
    const currentId = useSelector((state: RootState) => state.authentication.user?.company?._id);
    const currentName = useSelector((state: RootState) => state.authentication.user?.company?.name);
    const {triggerRelogin, switching} = useRelogin();
    // Reloaded after every switch; silent, so a failed load just leaves the menu as it was.
    const [load, setLoad] = useState({currentId, count: 1});
    if (load.currentId !== currentId) setLoad({currentId, count: load.count + 1});
    const {data} = useHttpRequest<TableResponse<BasicCompanyInfoFormResponseType>>(COMPANIES_REQUEST, COMPANIES_BODY, load.count);
    const companies = useMemo(() => [...(data?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [data]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" disabled={switching}>
                    {switching ? "Switching…" : (currentName || "Company")}
                    <IconSelector />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 w-64 overflow-y-auto">
                {companies.map((company) => (
                    <DropdownMenuItem
                        key={company._id}
                        disabled={switching || company._id === currentId}
                        onSelect={() => triggerRelogin(company._id)}
                    >
                        <span className="truncate">{company.name}</span>
                        {company._id === currentId && <IconCheck className="ml-auto" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
