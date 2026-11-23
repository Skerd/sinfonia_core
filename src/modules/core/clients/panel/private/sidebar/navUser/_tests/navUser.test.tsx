import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType, ReactNode} from "react";

const state = vi.hoisted(() => ({user: {name: "Ada", surname: "Lovelace", email: "ada@example.com", photo: undefined as string | undefined, company: {_id: "c1", name: "Acme"}}}));

vi.mock("react-redux", () => ({
    useDispatch: () => vi.fn(),
    useSelector: (select: (root: {authentication: typeof state}) => unknown) => select({authentication: state}),
}));
vi.mock("react-router-dom", () => ({useNavigate: () => vi.fn(), Link: ({children}: {children: ReactNode}) => <>{children}</>}));
vi.mock("@coreModule/helpers/hooks/useHttpRequest.ts", () => ({default: () => ({data: null, loading: false, error: null})}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped}));
vi.mock("@coreModule/components/ui/sidebar.tsx", () => ({
    useSidebar: () => ({isMobile: false}),
    SidebarMenu: ({children}: {children: ReactNode}) => <div>{children}</div>,
    SidebarMenuItem: ({children}: {children: ReactNode}) => <div>{children}</div>,
    SidebarMenuButton: ({children}: {children: ReactNode}) => <div>{children}</div>,
}));
// Radix loads the image itself; the stub shows which source the avatar was given.
vi.mock("@coreModule/components/ui/avatar.tsx", () => ({
    Avatar: ({children}: {children: ReactNode}) => <span>{children}</span>,
    AvatarImage: ({src}: {src: string}) => <img data-testid="avatar-image" src={src} alt=""/>,
    AvatarFallback: ({children}: {children: ReactNode}) => <span>{children}</span>,
}));

import NavUser from "../index.tsx";

describe("sidebar user", () => {
    // TD-B154: a user without a photo made every page request `/api/auxiliary/media/undefined` (400)
    it("shows the initials and requests no image when the user has no photo", () => {
        state.user.photo = undefined;
        render(<NavUser/>);

        expect(screen.queryByTestId("avatar-image")).toBeNull();
        expect(screen.getByText("AL")).toBeTruthy();
    });

    it("shows the user's photo when there is one", () => {
        state.user.photo = "6512f0a1b2c3d4e5f6a7b8c9";
        render(<NavUser/>);

        expect(screen.getAllByTestId("avatar-image")[0].getAttribute("src")).toBe("/api/auxiliary/media/6512f0a1b2c3d4e5f6a7b8c9");
    });
});
