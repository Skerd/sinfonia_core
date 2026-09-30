import {describe, expect, it, vi} from "vitest";
import {render, screen, waitFor} from "@testing-library/react";

vi.mock("@coreModule/helpers/redux/store/generalStore.ts", () => ({
    store: {getState: () => ({}), dispatch: vi.fn(), subscribe: () => () => undefined},
}));
vi.mock("@coreModule/helpers/context/providers/theme-provider.tsx", () => ({
    ThemeProvider: ({children}: {children: unknown}) => <>{children}</>,
}));
vi.mock("@coreModule/helpers/context/providers/density-provider.tsx", () => ({
    DensityProvider: ({children}: {children: unknown}) => <>{children}</>,
}));
vi.mock("@coreModule/helpers/context/providers/language-provider.tsx", () => ({
    LanguageProvider: ({children}: {children: unknown}) => <>{children}</>,
}));
vi.mock("@coreModule/helpers/context/localStorage/authenticationStorage.ts", () => ({
    ensureDeviceId: () => undefined,
}));
vi.mock("@coreModule/helpers/hooks/useMobile.tsx", () => ({
    useIsMobile: () => false,
}));
vi.mock("@coreModule/components/ui/sonner.tsx", () => ({
    Toaster: () => null,
}));
vi.mock("@coreModule/components/custom/loader/loader.tsx", () => ({
    default: () => <div>loading</div>,
}));
vi.mock("@coreModule/clients/panel/private", () => ({
    default: () => {
        const {Outlet} = require("react-router-dom");
        return <Outlet />;
    },
}));
vi.mock("@coreModule/clients/panel/public/auth", () => ({
    default: () => <div>auth</div>,
}));
vi.mock("@coreModule/clients/panel/private/sidebar", () => ({
    default: () => <div>sidebar</div>,
}));
vi.mock("@coreModule/clients/panel/entryPoint", () => ({
    default: () => {
        throw new Error("panel crash");
    },
}));
vi.mock("@coreModule/components/ui/sidebar.tsx", () => ({
    SidebarProvider: ({children}: {children: unknown}) => <>{children}</>,
}));
vi.mock("@coreModule/helpers/hooks/useSelectedLanguage.ts", () => ({
    default: () => ({currentLanguage: null}),
}));
vi.mock("@coreModule/helpers/general/errors.ts", () => ({
    handleError: () => undefined,
}));

import CoreApp from "../coreApp";

describe("CoreApp ErrorBoundary", () => {
    it("catches a crash on private panel routes", async () => {
        render(<CoreApp />);
        await waitFor(() => {
            expect(screen.getByText(/something went wrong/i)).toBeTruthy();
        });
    });
});
