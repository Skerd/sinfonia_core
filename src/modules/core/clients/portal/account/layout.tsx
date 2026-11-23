import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import AccountShell from "./accountShell.tsx";

/** The visitor's account: what they booked, what they keep, their profile and their sign-in security. */
function PortalAccountLayout({resolveLanguageKey}: WithLanguageType) {
    return (
        <div className="site-container py-10 sm:py-14">
            <AccountShell
                navLabel={resolveLanguageKey("navLabel")}
                items={[
                    {to: "/account", end: true, label: resolveLanguageKey("navBookings")},
                    {to: "/account/saved", end: true, label: resolveLanguageKey("navSaved")},
                    {to: "/account/profile", end: true, label: resolveLanguageKey("navProfile")},
                    {to: "/account/security", end: true, label: resolveLanguageKey("navSecurity")},
                ]}
            />
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/account/layout.tsx"))(PortalAccountLayout);
