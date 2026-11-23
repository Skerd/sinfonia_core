import {act, renderHook} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {createRef} from "react";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {SignupFormResponseType} from "armonia/src/modules/core/api/user/public/signUp/signup.form.response.type.ts";
import {usePublicSignUpForm} from "../usePublicSignUpForm.ts";

const resolveLanguageKey = ((key: string) => key) as ResolveLanguageKey;
const submitEvent = {preventDefault: () => undefined} as React.FormEvent;

function filledIn(next?: string) {
    const onFilterChange = vi.fn();
    const innerRef = createRef<WithAxiosLifecycleRef<SignupFormResponseType>>();
    const {result} = renderHook(() => usePublicSignUpForm({resolveLanguageKey, languageCode: "en-US", onFilterChange, innerRef, busy: false, next}));
    act(() => {
        result.current.setName(" Ann ");
        result.current.setSurname("Lee");
        result.current.setEmail("ann@example.com");
        result.current.setPassword("Str0ng!Pass2026");
        result.current.setConfirmPassword("Str0ng!Pass2026");
    });
    act(() => result.current.handleSubmit(submitEvent));
    return onFilterChange;
}

describe("usePublicSignUpForm (P23.12)", () => {
    it("sends the page the person was going to, so the activation link brings them back there", () => {
        expect(filledIn("/business/new?type=carRental&ref=rental")).toHaveBeenCalledWith(
            expect.objectContaining({name: "Ann", email: "ann@example.com", next: "/business/new?type=carRental&ref=rental"}),
        );
    });

    it("sends no next when there is none", () => {
        const onFilterChange = filledIn();
        expect(onFilterChange).toHaveBeenCalledTimes(1);
        expect(onFilterChange.mock.calls[0][0]).not.toHaveProperty("next");
    });
});
