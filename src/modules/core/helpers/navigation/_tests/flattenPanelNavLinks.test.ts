import {describe, expect, it} from "vitest";
import {flattenPanelNavLinks} from "@coreModule/helpers/navigation/flattenPanelNavLinks.ts";
import type {NavGroup} from "@coreModule/helpers/types/sidebarNav.types.ts";

const open = {permissions: [], usersPermissions: [], atLeastOnePermission: false};

describe("flattenPanelNavLinks", () => {
    it("returns leaf links at every depth in order, tagged with their group", () => {
        const groups: NavGroup[] = [
            {...open, title: "General", items: [{...open, title: "Home", url: "/", badge: 2}]},
            {
                ...open,
                title: "Settings",
                items: [{
                    ...open,
                    title: "Configurations",
                    items: [
                        {...open, title: "Users", url: "/users"},
                        {
                            ...open,
                            title: "eCommerce",
                            items: [{...open, title: "POS", url: {pathname: "/pos", search: "?tab=1"}}],
                        },
                    ],
                }],
            },
        ];

        expect(flattenPanelNavLinks(groups)).toEqual([
            {title: "Home", url: "/", icon: undefined, groupTitle: "General", badge: 2},
            {title: "Users", url: "/users", icon: undefined, groupTitle: "Settings", badge: undefined},
            {title: "POS", url: "/pos?tab=1", icon: undefined, groupTitle: "Settings", badge: undefined},
        ]);
    });

    it("skips links without a url and empty collapsibles", () => {
        const groups: NavGroup[] = [{
            ...open,
            title: "G",
            items: [
                {...open, title: "Blank", url: ""},
                {...open, title: "Empty", items: []},
            ],
        }];
        expect(flattenPanelNavLinks(groups)).toEqual([]);
    });
});
