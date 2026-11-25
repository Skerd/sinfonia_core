import {lazy} from "react";
import type {RouteConfigArgs} from "@coreModule/helpers/types/routeConfigContribution.types.ts";
import {runRouteConfigContributions} from "@coreModule/helpers/moduleContributions/loadRouteConfigContributions.ts";
import type {PublicChatInboxFilter} from "armonia/src/modules/core/api/user/private/chats/channels/channels.constants.ts";

// Pages load on first visit (D21); the panel shell's Suspense boundary shows the loader.
const EditCompany = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/companies/editCompany.tsx"));
const AccountSettings = lazy(() => import("@coreModule/clients/panel/private/accountSettings"));
const CreateUserAddress = lazy(() => import("@coreModule/clients/panel/private/accountSettings/addresses/createUserAddress.tsx"));
const EditUserAddress = lazy(() => import("@coreModule/clients/panel/private/accountSettings/addresses/editUserAddress.tsx"));
const Users = lazy(() => import("@coreModule/clients/panel/private/users"));
const NotFound = lazy(() => import("@coreModule/components/custom/pages/notFound.tsx"));
const AllCountries = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/countries"));
const CreateCountry = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/countries/createCountry.tsx"));
const EditCountry = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/countries/editCountry.tsx"));
const AllStates = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/states"));
const CreateState = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/states/createState.tsx"));
const EditState = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/states/editState.tsx"));
const AllCities = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/cities"));
const CreateCity = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/cities/createCity.tsx"));
const EditCity = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/cities/editCity.tsx"));
const AllCurrencies = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/currencies"));
const CreateCurrency = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/currencies/createCurrency.tsx"));
const EditCurrency = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/currencies/editCurrency.tsx"));
const CreateRole = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/roles/createRole.tsx"));
const EditRole = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/roles/editRole.tsx"));
const Roles = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/roles"));
const AllCompanies = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/companies"));
const Chat = lazy(() => import("@coreModule/clients/panel/private/chat"));
const OnlineResources = lazy(() => import("@coreModule/clients/panel/private/online"));
const UploadReview = lazy(() => import("@coreModule/clients/panel/private/tenancy/uploadReview"));
const ReportDesk = lazy(() => import("@coreModule/clients/panel/private/tenancy/reports"));
const MyCompany = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/companies/myCompany"));
const AllSmtpServers = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers"));
const CreateSmtpServer = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/createSmtpServer.tsx"));
const EditSmtpServer = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/editSmtpServer.tsx"));
const AllMessagingProviders = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders"));
const CreateMessagingProvider = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/createMessagingProvider.tsx"));
const EditMessagingProvider = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/editMessagingProvider.tsx"));
const AllCronJobs = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/cronJobs"));
const EditCronJob = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/cronJobs/editCronJob.tsx"));
const PanelHomePage = lazy(() => import("@coreModule/clients/panel/private/home/PanelHomePage.tsx"));
const AllBlogPosts = lazy(() => import("@coreModule/clients/panel/private/blogPosts"));
const CreateBlogPost = lazy(() => import("@coreModule/clients/panel/private/blogPosts/createBlogPost.tsx"));
const EditBlogPost = lazy(() => import("@coreModule/clients/panel/private/blogPosts/editBlogPost.tsx"));
const AllBlogCategories = lazy(() => import("@coreModule/clients/panel/private/blogCategories"));
const CreateBlogCategory = lazy(() => import("@coreModule/clients/panel/private/blogCategories/createBlogCategory.tsx"));
const EditBlogCategory = lazy(() => import("@coreModule/clients/panel/private/blogCategories/editBlogCategory.tsx"));

function safeDecode(value: string | null): string | undefined {
    if (value == null || value === "") return undefined;
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export function renderCenterPanelContent(args: RouteConfigArgs) {
    /*
     * Home is matched before the module contributions rather than being mounted
     * as a `z-50` overlay outside the shell. As an overlay it had to render
     * `<></>` on every other route while staying mounted, and it carried its own
     * copy of the notification / theme / language cluster because it sat above
     * the shell header that already provides them.
     */
    if (!args.menu || args.menu === "home") return <PanelHomePage />;

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
        if (subview === "websiteChats") {
            const websiteChannels: PublicChatInboxFilter = segments[2] === "mine" ? "mine" : "waiting";
            return <Chat websiteChannels={websiteChannels} />;
        }
        if (subview === "info") return <MyCompany />;
        if (subview === "blogPosts") {
            const blogPostId = searchParams.get("blogPostId") || undefined;
            const blogPostName = safeDecode(searchParams.get("blogPostName")) || undefined;
            if (segments[2] === "create") return <CreateBlogPost />;
            if (segments[2] === "edit") return <EditBlogPost entityId={blogPostId} entityName={blogPostName} />;
            return <AllBlogPosts />;
        }
    }

    // Account routes
    if (menu === "account") {
        if (subview === "addresses" && segments[2] === "create") return <CreateUserAddress />;
        if (subview === "addresses" && segments[2] === "edit") {
            const userAddressId = searchParams.get("userAddressId") || undefined;
            if (userAddressId) return <EditUserAddress entityId={userAddressId} />;
        }
        const accountTabs = ["account", "security", "notifications", "notificationCenter", "apps", "addresses", "savedsearches", "providerprofile"];
        if (accountTabs.includes(subview || "")) return <AccountSettings />;
    }

    // Tenancy routes
    if (menu === "tenancy") {
        if (subview === "serverPerformance") return <OnlineResources />;
        if (subview === "uploadReview") return <UploadReview />;
        if (subview === "reports") return <ReportDesk />;
        if (subview === "cronJobs") {
            const cronJobId = searchParams.get("cronJobId") || undefined;
            const cronJobName = safeDecode(searchParams.get("cronJobName")) || undefined;
            if (segments[2] === "edit") {
                return <EditCronJob entityId={cronJobId} entityName={cronJobName} />;
            }
            return <AllCronJobs />;
        }
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
            const blogCategoryId = searchParams.get("blogCategoryId") || undefined;
            const blogCategoryName = safeDecode(searchParams.get("blogCategoryName")) || undefined;

            if (resource === "companies") {
                if (action === "edit") {
                    return <EditCompany companyId={companyId} companyName={companyName} overrideCompanyId={companyId} />;
                }
                if (action === undefined) return <AllCompanies />;
            }
            if (resource === "roles") {
                if (action === "create") return <CreateRole />;
                if (action === "edit") return <EditRole entityId={roleId} entityName={roleName} />;
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
            if (resource === "blogCategories") {
                if (action === "create") return <CreateBlogCategory />;
                if (action === "edit") return <EditBlogCategory entityId={blogCategoryId} entityName={blogCategoryName} />;
                if (action === undefined) return <AllBlogCategories />;
            }
            if (resource === "cronJobs") {
                const cronJobId = searchParams.get("cronJobId") || undefined;
                const cronJobName = safeDecode(searchParams.get("cronJobName")) || undefined;
                if (action === "edit") {
                    return <EditCronJob entityId={cronJobId} entityName={cronJobName} />;
                }
                if (action === undefined) return <AllCronJobs />;
            }
        }
    }

    return <NotFound />;
}
