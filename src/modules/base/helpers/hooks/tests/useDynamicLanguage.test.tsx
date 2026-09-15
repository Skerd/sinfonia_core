import {act, renderHook} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ReactNode} from "react";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import languageReducer, {changeLanguage} from "@coreModule/helpers/redux/slices/languageSlice.ts";
import useSelectedLanguage from "@baseModule/helpers/hooks/useSelectedLanguage.ts";
import {resolveTranslationKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useDynamicLanguage} from "@baseModule/helpers/hooks/useDynamicLanguage.ts";

vi.mock("@baseModule/helpers/hooks/useSelectedLanguage.ts", () => ({default: vi.fn()}));

const selectedLanguageMock = vi.mocked(useSelectedLanguage);

type LanguageState = {currentLanguage: Record<string, unknown> | null; loading: boolean};

function mockLanguage({currentLanguage, loading}: LanguageState) {
    selectedLanguageMock.mockReturnValue({currentLanguage, loading, error: false, errorDescription: ""});
}

const dictionary = {
    title: "Cities",
    empty: "",
    count: 0,
    enabled: false,
    missingValue: null,
    form: {name: {label: "Name"}},
    options: ["first", "second"],
};

describe("resolveTranslationKey", () => {
    it("resolves top-level and nested dot keys", () => {
        expect(resolveTranslationKey(dictionary, "title")).toBe("Cities");
        expect(resolveTranslationKey(dictionary, "form.name.label")).toBe("Name");
    });

    it("returns objects and arrays, and indexes into arrays", () => {
        expect(resolveTranslationKey(dictionary, "form.name")).toEqual({label: "Name"});
        expect(resolveTranslationKey(dictionary, "options")).toEqual(["first", "second"]);
        expect(resolveTranslationKey(dictionary, "options.1")).toBe("second");
    });

    it("returns existing falsy values instead of the placeholder", () => {
        expect(resolveTranslationKey(dictionary, "empty")).toBe("");
        expect(resolveTranslationKey(dictionary, "count")).toBe(0);
        expect(resolveTranslationKey(dictionary, "enabled")).toBe(false);
    });

    it("returns the placeholder for missing keys, null values, and paths through non-objects", () => {
        expect(resolveTranslationKey(dictionary, "nope")).toBe("---nope---");
        expect(resolveTranslationKey(dictionary, "missingValue")).toBe("---missingValue---");
        expect(resolveTranslationKey(dictionary, "title.deeper")).toBe("---title.deeper---");
        expect(resolveTranslationKey(dictionary, "form.address.street")).toBe("---form.address.street---");
    });

    it("returns null instead of the placeholder when asked", () => {
        expect(resolveTranslationKey(dictionary, "nope", true)).toBeNull();
        expect(resolveTranslationKey(dictionary, "title.deeper", true)).toBeNull();
    });

    it("treats a missing dictionary as every key missing", () => {
        expect(resolveTranslationKey(null, "title")).toBe("---title---");
        expect(resolveTranslationKey(undefined, "title", true)).toBeNull();
    });
});

describe("useDynamicLanguage", () => {
    function setup(initialPath = "src/modules/core/components/cities/citySheetView.tsx") {
        const store = configureStore({reducer: {language: languageReducer}});
        store.dispatch(changeLanguage("en-US"));
        const wrapper = ({children}: {children: ReactNode}) => <Provider store={store}>{children}</Provider>;
        const view = renderHook(({path}: {path: string}) => useDynamicLanguage(path), {
            initialProps: {path: initialPath},
            wrapper,
        });
        return {...view, store};
    }

    beforeEach(() => {
        selectedLanguageMock.mockReset();
        mockLanguage({currentLanguage: dictionary, loading: false});
    });

    it("loads the dictionary for the path, keyed like withLanguage", () => {
        setup("src/modules/core/components/cities/citySheetView.tsx");

        expect(selectedLanguageMock).toHaveBeenCalledWith(
            "src_modules_core_components_cities_citySheetView.tsx",
            "src/modules/core/components/cities/citySheetView.tsx",
        );
    });

    it("returns the store's language code, the dictionary and its loading state", () => {
        mockLanguage({currentLanguage: null, loading: true});
        const {result, rerender, store} = setup();

        expect(result.current).toMatchObject({languageCode: "en-US", currentLanguage: null, loading: true});

        mockLanguage({currentLanguage: dictionary, loading: false});
        act(() => {
            store.dispatch(changeLanguage("de-CH"));
        });
        rerender({path: "src/modules/core/components/cities/citySheetView.tsx"});

        expect(result.current).toMatchObject({languageCode: "de-CH", currentLanguage: dictionary, loading: false});
    });

    it("resolves keys against the loaded dictionary", () => {
        const {result} = setup();

        expect(result.current.resolveLanguageKey("form.name.label")).toBe("Name");
        expect(result.current.resolveLanguageKey("count")).toBe(0);
        expect(result.current.resolveLanguageKey("nope")).toBe("---nope---");
        expect(result.current.resolveLanguageKey("nope", true)).toBeNull();
    });

    it("resolves every key to its placeholder while nothing is loaded", () => {
        mockLanguage({currentLanguage: null, loading: false});
        const {result} = setup("");

        expect(selectedLanguageMock).toHaveBeenCalledWith("", "");
        expect(result.current.resolveLanguageKey("title")).toBe("---title---");
    });

    it("keeps the result and resolver stable until the dictionary changes", () => {
        const {result, rerender} = setup();
        const first = result.current;

        rerender({path: "src/modules/core/components/cities/citySheetView.tsx"});
        expect(result.current).toBe(first);
        expect(result.current.resolveLanguageKey).toBe(first.resolveLanguageKey);

        mockLanguage({currentLanguage: {title: "Städte"}, loading: false});
        rerender({path: "src/modules/core/components/cities/citySheetView.tsx"});

        expect(result.current).not.toBe(first);
        expect(result.current.resolveLanguageKey).not.toBe(first.resolveLanguageKey);
        expect(result.current.resolveLanguageKey("title")).toBe("Städte");
    });
});
