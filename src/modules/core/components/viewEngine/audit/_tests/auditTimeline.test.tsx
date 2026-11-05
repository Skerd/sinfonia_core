import {render} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import type {DocumentAuditEntryDto} from "armonia/src/modules/core/api/auxiliary/private/auditLog/documentAuditLog.dto.ts";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {AuditEntry} from "@coreModule/components/viewEngine/audit/auditTimeline.tsx";

const words: Record<string, string> = {actionRead: "opened", actionUpdate: "updated", actionErase: "erased a person's data"};
const t: ResolveLanguageKey = (key: string) => words[key] ?? key;
const titles: Record<string, string> = {history: "Medical history"};
const fieldTitle = (field: string) => titles[field] ?? field;

describe("AuditEntry", () => {
    it("shows a READ entry as who opened which fields, with no values (SEC-06)", () => {
        const entry: DocumentAuditEntryDto = {
            id: "1",
            createdAt: new Date().toISOString(),
            action: "READ",
            actor: {id: "u1", displayName: "Dana Dentist"},
            changes: [{field: "history", from: null, to: null}],
        };
        const {container} = render(<ul><AuditEntry entry={entry} isLast fieldTitle={fieldTitle} hints={undefined} t={t} /></ul>);

        expect(container.textContent).toContain("Dana Dentist opened · Medical history");
        expect(container.querySelector("dl")).toBeNull();
    });

    it("shows an ERASE entry as who erased a person's data, with nothing about the person (D57)", () => {
        const entry: DocumentAuditEntryDto = {id: "2", createdAt: new Date().toISOString(), action: "ERASE", actor: {id: "u2", displayName: "Clinic Admin"}, changes: []};
        const {container} = render(<ul><AuditEntry entry={entry} isLast fieldTitle={fieldTitle} hints={undefined} t={t} /></ul>);
        expect(container.textContent).toContain("Clinic Admin erased a person's data");
        expect(container.querySelector("dl")).toBeNull();
    });
});
