import {useEffect, useState} from "react";
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
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {useRelogin} from "@coreModule/helpers/hooks/useRelogin.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";

/**
 * Same company switch as the panel sidebar: `POST /api/user/login/differentCompany`.
 * Studio stays on the open view; the new session's company is what sample rows load.
 */
export default function StudioCompanySwitcher() {
    const currentId = useSelector((state: RootState) => state.authentication.user?.company?._id);
    const currentName = useSelector((state: RootState) => state.authentication.user?.company?.name);
    const {triggerRelogin, switching} = useRelogin();
    const [companies, setCompanies] = useState<BasicCompanyInfoFormResponseType[]>([]);

    useEffect(() => {
        const abort = new AbortController();
        apiClient
            .post<TableResponse<BasicCompanyInfoFormResponseType>>(
                "/api/companies/basicInfo",
                {offset: 0, limit: 50},
                {signal: abort.signal},
            )
            .then(({data}) => {
                if (abort.signal.aborted) return;
                const rows = [...(data?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));
                setCompanies(rows);
            })
            .catch(() => {
                if (abort.signal.aborted) return;
            });
        return () => abort.abort();
    }, [currentId]);

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
