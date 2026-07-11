import EditCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/editCompany.tsx";
import AccountSettings from "@coreModule/clients/panel/private/accountSettings";
import NotificationCenter from "@coreModule/clients/panel/private/accountSettings/notificationCenter";
import Users from "@coreModule/clients/panel/private/users";
import NotFound from "@coreModule/components/custom/pages/notFound.tsx";
import AllCountries from "@coreModule/clients/panel/private/tenancy/systemSettings/countries";
import CreateCountry from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/createCountry.tsx";
import EditCountry from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/editCountry.tsx";
import AllStates from "@coreModule/clients/panel/private/tenancy/systemSettings/states";
import CreateState from "@coreModule/clients/panel/private/tenancy/systemSettings/states/createState.tsx";
import EditState from "@coreModule/clients/panel/private/tenancy/systemSettings/states/editState.tsx";
import AllCities from "@coreModule/clients/panel/private/tenancy/systemSettings/cities";
import CreateCity from "@coreModule/clients/panel/private/tenancy/systemSettings/cities/createCity.tsx";
import EditCity from "@coreModule/clients/panel/private/tenancy/systemSettings/cities/editCity.tsx";
import AllCurrencies from "@coreModule/clients/panel/private/tenancy/systemSettings/currencies";
import CreateCurrency from "@coreModule/clients/panel/private/tenancy/systemSettings/currencies/createCurrency.tsx";
import EditCurrency from "@coreModule/clients/panel/private/tenancy/systemSettings/currencies/editCurrency.tsx";
import CreateRole from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/createRole.tsx";
import EditRole from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/editRole.tsx";
import type {RouteConfigArgs} from "@coreModule/clients/panel/moduleContributions/routeConfigContribution.types.ts";
import {runRouteConfigContributions} from "@coreModule/clients/panel/moduleContributions/loadRouteConfigContributions.ts";
import Roles from "@coreModule/clients/panel/private/tenancy/systemSettings/roles";
import AllCompanies from "@coreModule/clients/panel/private/tenancy/systemSettings/companies";
import Chat from "@coreModule/clients/panel/private/chat";
import OnlineResources from "@coreModule/clients/panel/private/online";
import MyCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/myCompany";
import AllSmtpServers from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers";
import CreateSmtpServer from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/createSmtpServer.tsx";
import EditSmtpServer from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/editSmtpServer.tsx";
import AllMessagingProviders from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders";
import CreateMessagingProvider from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/createMessagingProvider.tsx";
import EditMessagingProvider from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/editMessagingProvider.tsx";
import Apps from "@coreModule/clients/panel/private/apps";

function safeDecode(value: string | null): string | undefined {
    if (value == null || value === "") return undefined;
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export function renderCenterPanelContent(args: RouteConfigArgs) {
    const fromModules = runRouteConfigContributions(args);
    if (fromModules !== undefined) return fromModules;
    return renderCoreCenterPanelContent(args);
}

function renderCoreCenterPanelContent({
    menu,
    subview,
    segments,
    searchParams,
}: RouteConfigArgs) {
    // Company routes
    if (menu === "company") {
        if (subview === "administration") return <Users administration={true} specificUserId={"yes"}/>;
        if (subview === "users") return <Users administration={false} specificUserId={"yes"}/>;
        if (subview === "chats") return <Chat />;
        if (subview === "info") return <MyCompany />;
    }

    // Account routes
    if (menu === "account") {
        if (["account", "security", "notifications"].includes(subview || "")) return <AccountSettings />;
        if (subview === "notificationCenter") return <NotificationCenter />;
        if (subview === "apps") return <Apps />;
    }

    // Tenancy routes
    if (menu === "tenancy") {
        if (subview === "serverPerformance") return <OnlineResources />;
        if (subview === "systemSettings") {
            const resource = segments[2];
            const action = segments[3];

            const countryId = searchParams.get("countryId") || undefined;
            const countryName = safeDecode(searchParams.get("countryName")) || undefined;
            const stateId = searchParams.get("stateId") || undefined;
            const stateName = safeDecode(searchParams.get("stateName")) || undefined;
            const cityId = searchParams.get("cityId") || undefined;
            const cityName = safeDecode(searchParams.get("cityName")) || undefined;
            const currencyId = searchParams.get("currencyId") || undefined;
            const currencyName = safeDecode(searchParams.get("currencyName")) || undefined;
            const roleId = searchParams.get("roleId") || undefined;
            const roleName = safeDecode(searchParams.get("roleName")) || undefined;
            const companyId = searchParams.get("companyId") || undefined;
            const companyName = safeDecode(searchParams.get("companyName")) || undefined;
            const smtpServerId = searchParams.get("smtpServerId") || undefined;
            const smtpServerName = safeDecode(searchParams.get("smtpServerName")) || undefined;
            const messagingProviderId = searchParams.get("messagingProviderId") || undefined;
            const messagingProviderName = safeDecode(searchParams.get("messagingProviderName")) || undefined;

            if (resource === "companies") {
                if (action === "edit") {
                    return <EditCompany companyId={companyId} companyName={companyName} overrideCompanyId={companyId} />;
                }
                if (action === undefined) return <AllCompanies />;
            }
            if (resource === "roles") {
                if (action === "create") return <CreateRole />;
                if (action === "edit") return <EditRole roleId={roleId} roleName={roleName} />;
                if (action === undefined) return <Roles />;
            }
            if (resource === "countries") {
                if (action === "create") return <CreateCountry />;
                if (action === "edit") return <EditCountry entityId={countryId} entityName={countryName} />;
                if (action === undefined) return <AllCountries />;
            }
            if (resource === "states") {
                if (action === "create") return <CreateState />;
                if (action === "edit") return <EditState entityId={stateId} entityName={stateName}/>;
                if (action === undefined) return <AllStates countryId={countryId} countryName={countryName}/>;
            }
            if (resource === "cities") {
                if (action === "create") return <CreateCity/>;
                if (action === "edit") return <EditCity entityId={cityId} entityName={cityName}/>;
                if (action === undefined) {
                    return <AllCities countryId={countryId} countryName={countryName} stateId={stateId} stateName={stateName} cityId={cityId} cityName={cityName}/>;
                }
            }
            if (resource === "currencies") {
                if (action === "create") return <CreateCurrency />;
                if (action === "edit") return <EditCurrency entityId={currencyId} entityName={currencyName}/>;
                if (action === undefined) return <AllCurrencies/>;
            }
            if (resource === "smtpServers") {
                if (action === "create") return <CreateSmtpServer />;
                if (action === "edit" && smtpServerId) {
                    return <EditSmtpServer entityId={smtpServerId} entityName={smtpServerName} />;
                }
                if (action === undefined) return <AllSmtpServers />;
            }

            if (resource === "messagingProviders") {
                if (action === "create") return <CreateMessagingProvider />;
                if (action === "edit" && messagingProviderId) {
                    return <EditMessagingProvider entityId={messagingProviderId} entityName={messagingProviderName} />;
                }
                if (action === undefined) return <AllMessagingProviders />;
            }
        }
    }

    return <NotFound />;
}
