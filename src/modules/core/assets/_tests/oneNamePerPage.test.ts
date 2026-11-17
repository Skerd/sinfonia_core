import {describe, expect, it} from "vitest";

const files = import.meta.glob("../languages/*/clients/panel/private/**/*.json", {eager: true, import: "default"}) as Record<string, Record<string, unknown>>;
const read = (locale: string, path: string) => files[`../languages/${locale}/clients/panel/private/${path}`] as Record<string, any>;

// TD-F120: one page, several names (Activity / Notification Center, Connected apps / App Integrations, Performance /
// Server Monitoring, Mail servers / Outgoing mail servers / Add SMTP server).
describe("page titles", () => {
    for (const locale of ["en-US", "de-CH", "fr-FR", "it-IT", "sq-AL"]) {
        it(`use the menu's name in ${locale}`, () => {
            const account = read(locale, "accountSettings/index.json");
            const menus = read(locale, "sidebar/index.json").menus.tenancy;
            expect(read(locale, "accountSettings/notificationCenter/index.json").title).toBe(account.activity);
            expect(read(locale, "accountSettings/apps/index.json").title).toBe(account.connectedApps);
            expect(read(locale, "online/index.json").title).toBe(menus.resources.serverPerformance.title);
            expect(read(locale, "tenancy/systemSettings/smtpServers/index.json").title).toBe(menus.systemSettings.smtpServers.title);
            const smtpTexts = JSON.stringify(read(locale, "tenancy/systemSettings/smtpServers/index.json"));
            expect(smtpTexts).not.toMatch(/SMTP[- ]server|server SMTP|serveurs? SMTP|serverë? SMTP/i);
        });
    }
});
