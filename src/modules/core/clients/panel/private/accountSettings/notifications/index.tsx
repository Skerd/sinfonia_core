import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {ContentSection} from "@coreModule/clients/panel/private/accountSettings/components/content-section.tsx";
import {getAccountSettingsNotificationSections} from "@coreModule/helpers/moduleContributions/loadAccountSettingsContributions.ts";

type NotificationsProps = WithLanguageType & {
    specificUserId?: string;
};

/**
 * Notification preferences tab.
 *
 * Core owns the page but none of the preferences: each module contributes its
 * own section through `accountSettingsContribution`, so core never imports
 * module code. With no module enabled that contributes here, the tab honestly
 * says there is nothing to configure rather than showing dead switches — which
 * is what this file used to do, with a hardcoded form whose submit handler was
 * a no-op and no backend behind it at all.
 */
function NotificationsForm({resolveLanguageKey, specificUserId}: NotificationsProps) {
    const sections = getAccountSettingsNotificationSections({specificUserId});

    return (
        <ContentSection
            title={resolveLanguageKey("title")}
            desc={resolveLanguageKey("description")}
        >
            {sections.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    {specificUserId
                        ? resolveLanguageKey("otherUserUnavailable")
                        : resolveLanguageKey("empty")}
                </p>
            ) : (
                <div className="flex flex-col gap-y-8">
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
