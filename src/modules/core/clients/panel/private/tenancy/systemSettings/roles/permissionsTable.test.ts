import {describe, expect, it} from "vitest";
import {flattenPermissionsToRows} from "./permissionsTable.tsx";

const label = (key: string) => key;

describe("flattenPermissionsToRows", () => {
    it("shows each @action as its own row with the Perform column set (D14)", () => {
        const rows = flattenPermissionsToRows({
            Reservations: {
                self: [
                    {_id: "p1", tag: "reservations[action:cancel]", group: "Reservations", active: true},
                    {_id: "p2", tag: "reservations[create:reservations]", group: "Reservations", active: false},
                ],
                others: [],
            },
        }, label);

        const cancel = rows.find((row) => row.groupDisplayName === "permissions.Reservations.cancel");
        expect(cancel).toMatchObject({action: true, actionActive: true, actionIds: ["p1"], create: false, scope: "global"});
        expect(rows.find((row) => row.create)).toMatchObject({action: false, createIds: ["p2"]});
    });

    it("labels a field from the model, then the shared lifecycle labels, then its readable path (UX-09)", () => {
        const dictionary: Record<string, string> = {
            "permissions.Leases.monthlyRent": "Monthly rent",
            "commonFields.createdAt": "Created at",
        };
        const resolve = ((key: string, returnUndefinedIfNeeded?: boolean) => dictionary[key] ?? (returnUndefinedIfNeeded ? null : `---${key}---`)) as Parameters<typeof flattenPermissionsToRows>[1];
        const tags = ["leases[read:monthlyRent]", "leases[read:createdAt]", "leases[read:businessAccount]", "leases[read:address.country]"];
        const rows = flattenPermissionsToRows({
            Leases: {self: tags.map((tag, i) => ({_id: `p${i}`, tag, group: "Leases", active: false})), others: []},
        }, resolve);

        expect(rows.map((row) => row.groupDisplayName).sort()).toEqual(["Address Country", "Business Account", "Created at", "Monthly rent"]);
    });
});

