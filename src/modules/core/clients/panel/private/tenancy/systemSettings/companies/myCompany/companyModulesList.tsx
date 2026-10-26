import {compose} from "redux";
import {Blocks} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";

type CompanyModulesListProps = WithLanguageType & {
    modules: string[];
};

/** Read-only: a company's modules are granted by the platform owner, never by the company itself. */
function CompanyModulesList({modules, resolveLanguageKey}: CompanyModulesListProps) {
    return (
        <section className="flex w-full max-w-6xl flex-col gap-2 rounded-lg border p-4">
            <div className="flex items-center gap-2">
                <Blocks size={16} />
                <h3 className="font-medium">{resolveLanguageKey("title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{resolveLanguageKey("managedByPlatform")}</p>
            <div className="flex flex-wrap gap-1">
                {modules.map((name) => (
                    <Badge key={"my_company_module_" + name} variant="outline">
                        {resolveLanguageKey(`moduleNames.${name}`, true) ?? name}
                    </Badge>
                ))}
            </div>
        </section>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/myCompany/companyModulesList.tsx"),
    withDebug(true, true, "companies")
)(CompanyModulesList);
