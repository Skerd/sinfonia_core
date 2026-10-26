import {compose} from "redux";
import {useImperativeHandle, useState} from "react";
import {Blocks, LoaderCircle} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@coreModule/components/ui/dialog.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import type {
    PlatformModule,
    PlatformModulesResponse,
    SetCompanyModulesResponse,
} from "armonia/src/modules/core/api/platform/private/companies/platformModules.dto.ts";
import {
    selectedDependentsOf,
    toggleModule,
} from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/dialogs/companyModuleSelection.ts";

const LANGUAGE_PATH = "src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/dialogs/manageModulesDialog.tsx";

type ManageModulesDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: Partial<Company> & {_id: string};
    onSuccess?: (modules: string[]) => void;
};

type ManageModulesFormProps = WithLanguageType & WithAxiosType<SetCompanyModulesResponse> & ManageModulesDialogProps & {
    modulesCatalog: PlatformModule[];
};

/**
 * Checkbox list of the platform's modules. Checking one adds what it depends on; one that a
 * checked module needs cannot be unchecked; required and uninstalled modules are locked. The
 * server re-applies the dependency closure, so this is a convenience, not the rule.
 */
function ManageModulesForm({
    open,
    onOpenChange,
    company,
    modulesCatalog,
    onSuccess = () => {},
    resolveLanguageKey,
    onFilterChange,
    innerRef,
    loading,
}: ManageModulesFormProps) {
    const [selected, setSelected] = useState<string[]>(() => company.modules ?? []);

    useImperativeHandle(innerRef, () => ({
        success: (response: SetCompanyModulesResponse) => {
            onSuccess(response.modules);
            onOpenChange(false);
        },
    }));

    const moduleLabel = (name: string) => resolveLanguageKey(`moduleNames.${name}`, true) ?? name;

    return (
        <Dialog open={open} onOpenChange={(o: boolean) => { if (!loading) onOpenChange(o); }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{resolveLanguageKey("title")}</DialogTitle>
                    <DialogDescription>{company.name} — {resolveLanguageKey("description")}</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                    {modulesCatalog.map((module) => {
                        const dependents = selectedDependentsOf(module.name, selected, modulesCatalog);
                        const locked = module.required || !module.installed || dependents.length > 0;
                        const note = module.required
                            ? resolveLanguageKey("required")
                            : !module.installed
                                ? resolveLanguageKey("notInstalled")
                                : dependents.length > 0
                                    ? `${resolveLanguageKey("requiredBy")} ${dependents.map(moduleLabel).join(", ")}`
                                    : module.description;
                        const id = `company_module_${module.name}`;
                        return (
                            <div key={module.name} className="flex items-start gap-3">
                                <Checkbox
                                    id={id}
                                    checked={module.required || selected.includes(module.name)}
                                    disabled={locked || loading}
                                    onCheckedChange={(checked) =>
                                        setSelected((current) => toggleModule(current, module.name, checked === true, modulesCatalog))}
                                />
                                <div className="flex flex-col gap-0.5">
                                    <Label htmlFor={id}>{moduleLabel(module.name)}</Label>
                                    {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <DialogFooter>
                    <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
                        {resolveLanguageKey("cancel")}
                    </Button>
                    <Button disabled={loading} onClick={() => onFilterChange({modules: selected})}>
                        {loading ? <LoaderCircle className="animate-spin" /> : <Blocks />}
                        {resolveLanguageKey("confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const ManageModulesFormConnected = compose(
    withLanguage(LANGUAGE_PATH),
    withAxios<SetCompanyModulesResponse>(
        {
            url: "/api/platform/companies/modules",
            method: "PUT",
            data: {},
            addToPath: [{whatToGet: ["company", "_id"]}],
        },
        true
    ),
    withDebug(true, true, "companies")
)(ManageModulesForm);

type ModulesCatalogProps = ManageModulesDialogProps
    & Omit<WithAxiosType<PlatformModulesResponse>, "data">
    & {modulesCatalog: PlatformModulesResponse | null};

/** Loads the module catalog, then shows the form. Mounted only while the dialog is open. */
function ModulesCatalog({modulesCatalog, open, onOpenChange, company, onSuccess}: ModulesCatalogProps) {
    if (!modulesCatalog) return <></>;
    return (
        <ManageModulesFormConnected
            open={open}
            onOpenChange={onOpenChange}
            company={company}
            onSuccess={onSuccess}
            modulesCatalog={modulesCatalog.data}
        />
    );
}

const ModulesCatalogConnected = compose(withLanguage(LANGUAGE_PATH))(
    withAxios<PlatformModulesResponse, Record<string, unknown>, "modulesCatalog">(
        {
            url: "/api/platform/companies/modules",
            method: "GET",
            data: {},
        },
        false,
        "modulesCatalog"
    )<ManageModulesDialogProps>(ModulesCatalog)
);

export default function ManageModulesDialog(props: ManageModulesDialogProps) {
    return <ModulesCatalogConnected {...props} />;
}
