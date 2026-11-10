import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {ContentSection} from "@coreModule/clients/panel/private/accountSettings/components/content-section.tsx";
import {getAccountSettingsNotificationSections} from "@coreModule/helpers/moduleContributions/loadAccountSettingsContributions.ts";
import {getNotificationTypeGroups} from "@coreModule/helpers/moduleContributions/loadNotificationTypesContributions.ts";
import NotificationTypePreferences from "@coreModule/clients/panel/private/accountSettings/notifications/notificationTypePreferences.tsx";

type NotificationsProps = WithLanguageType & {
    specificUserId?: string;
};

/**
 * Notification preferences tab.
 *
 * Core owns the page and the per-type notification switches (D117), which list
 * the types modules declare in their `notificationTypes.json`; every other
 * preference is a module's own section through `accountSettingsContribution`,
 * so core never imports module code. With no module enabled that contributes here, the tab honestly
 * says there is nothing to configure rather than showing dead switches — which
 * is what this file used to do, with a hardcoded form whose submit handler was
 * a no-op and no backend behind it at all.
 *
 * Inspecting another user is a separate case: a module may contribute sections
 * for the account holder and withhold them here. That message is only honest
 * when the holder actually has preferences. An empty contribution list means
 * there is nothing to configure.
 */
function NotificationsForm({resolveLanguageKey, languageCode, specificUserId}: NotificationsProps) {
    const sections = getAccountSettingsNotificationSections({specificUserId});
    // Per-type switches for the notifications the company's modules declare (D117), core-owned like the page.
    const hasNotificationTypes = getNotificationTypeGroups(languageCode).length > 0;
    const withheldFromOtherUser = !!specificUserId
        && sections.length === 0
        && !hasNotificationTypes
        && getAccountSettingsNotificationSections({}).length > 0;

    return (
        <ContentSection
            title={resolveLanguageKey("title")}
            desc={resolveLanguageKey("description")}
        >
            {sections.length === 0 && !hasNotificationTypes ? (
                <p className="text-sm text-muted-foreground">
                    {withheldFromOtherUser
                        ? resolveLanguageKey("otherUserUnavailable")
                        : resolveLanguageKey("empty")}
                </p>
            ) : (
                <div className="flex flex-col gap-y-8">
                    {hasNotificationTypes && <NotificationTypePreferences specificUserId={specificUserId} />}
                    {sections.map((section) => (
                        <div key={section.id}>{section.render()}</div>
                    ))}
                </div>
            )}
        </ContentSection>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/notifications/index.tsx"),
)(NotificationsForm);
