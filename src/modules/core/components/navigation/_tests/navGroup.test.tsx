import {render} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {describe, expect, it, vi} from "vitest";

vi.mock("@coreModule/helpers/hooks/useMobile.tsx", () => ({useIsMobile: () => false}));

import {Sidebar, SidebarProvider} from "@coreModule/components/ui/sidebar.tsx";
import {NavGroup} from "../navGroup.tsx";
import type {NavItem} from "@coreModule/helpers/types/sidebarNav.types.ts";

const open = {permissions: [], usersPermissions: [], atLeastOnePermission: false};

describe("NavGroup", () => {
    /** Titles are translated and empty until the dictionary loads; keys built from them collided (TD-F18). */
    it("keys entries by their links, so empty titles do not collide", () => {
        const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const items: NavItem[] = [
            {...open, title: "", items: [{...open, title: "", url: "/realEstate/payments"}]},
            {...open, title: "", items: [{...open, title: "", url: "/realEstate/leases"}]},
            {...open, title: "", url: "/realEstate/sales"},
        ];
        render(
            <MemoryRouter>
                <SidebarProvider>
                    <Sidebar>
                        <NavGroup title="" items={items} />
                    </Sidebar>
                </SidebarProvider>
            </MemoryRouter>,
        );
        expect(errors.mock.calls.filter((call) => String(call[0]).includes("same key"))).toEqual([]);
        errors.mockRestore();
    });
});
