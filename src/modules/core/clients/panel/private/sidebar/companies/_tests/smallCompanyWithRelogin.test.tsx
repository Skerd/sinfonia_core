import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {Provider} from "react-redux";
import {combineReducers, configureStore} from "@reduxjs/toolkit";
import authenticationReducer, {signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import languageReducer from "@coreModule/helpers/redux/slices/languageSlice.ts";
import {DropdownMenu, DropdownMenuContent, DropdownMenuTrigger} from "@coreModule/components/ui/dropdown-menu.tsx";
import type {BasicCompanyInfoFormResponseType} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";

const {triggerRelogin} = vi.hoisted(() => ({triggerRelogin: vi.fn()}));
vi.mock("@coreModule/helpers/hooks/useRelogin.ts", () => ({
    useRelogin: () => ({triggerRelogin, switching: false}),
}));

import SmallCompanyWithReLogin from "../allCompaniesDropDownMenuContent/smallCompany/smallCompanyWithRelogin.tsx";

const CURRENT: BasicCompanyInfoFormResponseType = {_id: "company-current", name: "Alpine Reach", description: "", logo: null};
const OTHER: BasicCompanyInfoFormResponseType = {_id: "company-other", name: "Adria Home Fix", description: "", logo: null};

/** The open switcher menu of a user signed in to {@link CURRENT}. */
function renderMenu() {
    const signedOut = authenticationReducer(undefined, signOut());
    const authentication = {
        ...signedOut,
        user: {...signedOut.user, company: {...signedOut.user.company, _id: CURRENT._id}},
    } as typeof signedOut;
    const store = configureStore({
        reducer: combineReducers({authentication: authenticationReducer, language: languageReducer}),
        preloadedState: {authentication},
    });
    const onOpenChange = vi.fn();
    render(
        <Provider store={store}>
            <DropdownMenu open onOpenChange={onOpenChange}>
                <DropdownMenuTrigger>menu</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <SmallCompanyWithReLogin company={CURRENT}/>
                    <SmallCompanyWithReLogin company={OTHER}/>
                </DropdownMenuContent>
            </DropdownMenu>
        </Provider>,
    );
    return onOpenChange;
}

describe("SmallCompanyWithReLogin", () => {
    beforeEach(() => {
        triggerRelogin.mockClear();
        vi.useFakeTimers();
    });
    // A menu select arms the dialog dismiss guard, which swallows clicks for 500 ms; let it expire between tests.
    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    // Picking the company already signed in to did nothing visible: the menu stayed open.
    it("closes the menu without switching when the current company is picked", () => {
        const onOpenChange = renderMenu();

        fireEvent.click(screen.getByText(CURRENT.name));

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(triggerRelogin).not.toHaveBeenCalled();
    });

    it("switches to another company", () => {
        const onOpenChange = renderMenu();

        fireEvent.click(screen.getByText(OTHER.name));

        expect(triggerRelogin).toHaveBeenCalledWith(OTHER._id);
        expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
});
