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
});
