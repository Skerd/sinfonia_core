import {useCallback, useEffect, useRef, useState} from "react";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Eraser} from "lucide-react";
import {ApiSelect} from "@coreModule/components/custom/apiSelect";
import {SimpleSelect} from "@coreModule/components/custom/simpleSelect";

const DEBOUNCE_MS = 300;

type UserFiltersFormProps = WithLanguageType & {
    filters: Record<string, unknown>;
    setFilters: (filters: Record<string, unknown>) => void;
    extraParams?: Record<string, unknown>;
};

function toLocalState(filters: Record<string, unknown> | undefined) {
    return {
        username: String(filters?.username ?? filters?.name ?? ""),
        name: String(filters?.name ?? filters?.username ?? ""),
        status: Array.isArray(filters?.status) ? filters.status as string[] : (filters?.status ? [filters.status] : []),
        roles: Array.isArray(filters?.roles) ? filters.roles as string[] : (filters?.roles ? [filters.roles] : []),
    };
}

function UserFilters({filters, setFilters, resolveLanguageKey, extraParams}: UserFiltersFormProps) {
    const [local, setLocal] = useState(toLocalState(filters));
    const stateRef = useRef(local);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    stateRef.current = local;

    useEffect(() => {
        setLocal(toLocalState(filters));
    }, [filters?.username, filters?.name, JSON.stringify(filters?.status), JSON.stringify(filters?.roles)]);

    const commitFilters = useCallback(
        (next: ReturnType<typeof toLocalState>) => {
            const payload: Record<string, unknown> = {};
            const searchVal = (next.username || next.name || "").trim();
            if (searchVal) {
                payload.username = searchVal;
                payload.name = searchVal;
            }
            const statusFilter = next.status?.filter((s) => s !== "all") ?? [];
            if (statusFilter.length > 0) payload.status = statusFilter;
            if (next.roles?.length) payload.roles = next.roles;
            setFilters(payload);
        },
        [setFilters]
    );

    const onSearchChange = useCallback(
        (value: string) => {
            const next = {...stateRef.current, username: value, name: value};
            stateRef.current = next;
            setLocal(next);
            if (debounceRef.current != null) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                debounceRef.current = null;
                commitFilters(stateRef.current);
            }, DEBOUNCE_MS);
        },
        [commitFilters]
    );

    const onStatusChange = useCallback(
        (value: string[]) => {
            const next = {...stateRef.current, status: value ?? []};
            stateRef.current = next;
            setLocal(next);
            commitFilters(next);
        },
        [commitFilters]
    );

    const onRolesChange = useCallback(
        (value: string | string[]) => {
            const arr = Array.isArray(value) ? value : value ? [value] : [];
            const next = {...stateRef.current, roles: arr};
            stateRef.current = next;
            setLocal(next);
            commitFilters(next);
        },
        [commitFilters]
    );

    const onClear = useCallback(() => {
        const empty = toLocalState({});
        stateRef.current = empty;
        setLocal(empty);
        if (debounceRef.current != null) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        setFilters({});
    }, [setFilters]);

    return (
        <div className="flex grow me-4" style={{border: "0px solid red"}}>
            <div className="w-full grid grid-cols-2 lg:grid-cols-7 gap-2 md:gap-2">
                <div className="space-y-2 col-span-2 lg:col-span-3">
                    <Input
                        id="filter-username"
                        placeholder={resolveLanguageKey("filterSearch")}
                        value={local.username}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <SimpleSelect
                        options={[
                            // { value: "all", label: String(resolveLanguageKey("filterStatusAll")) },
                            { value: "active", label: String(resolveLanguageKey("statuses.active")) },
                            { value: "inactive", label: String(resolveLanguageKey("statuses.inactive")) },
                            { value: "invited", label: String(resolveLanguageKey("statuses.invited")) },
                        ]}
                        value={local.status}
                        onValueChange={(v: string | string[]) => onStatusChange(Array.isArray(v) ? v : [v])}
                        placeholder={String(resolveLanguageKey("filterStatus"))}
                        className="w-full"
                        multiple
                    />
                </div>
                <div className="space-y-2">
                    <ApiSelect
                        apiUrl="/api/user/permissions/accessible/roles/select"
                        postBody={{ administration: !!(extraParams as { administration?: boolean })?.administration }}
                        value={local.roles}
                        onValueChange={onRolesChange}
                        multiple
                        placeholder={resolveLanguageKey("filterRoles")}
                        resolveLanguageKey={resolveLanguageKey}
                        pageSize={100}
                        className="w-full"
                    />
                </div>
                <Button onClick={onClear} variant="outline" className="flex-1 sm:flex-none col-span-2 md:col-span-1">
                    <Eraser />
                    {resolveLanguageKey("clearFilters")}
                </Button>
            </div>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/userFilters.tsx")
)(UserFilters);
