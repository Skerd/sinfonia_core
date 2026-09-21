import {act, render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {Provider, useSelector} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import languageReducer, {changeLanguage} from "@coreModule/helpers/redux/slices/languageSlice.ts";
import mainConfig from "@coreModule/assets/languages/mainConfig.json";
import {isSupportedLanguageCode, LANGUAGE_STORAGE_KEY, LanguageProvider} from "@coreModule/helpers/context/providers/language-provider.tsx";
import {resetLocalStorageMemoryFallback} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";
import {writeFromAnotherTab} from "./storageUtils.ts";

const DEFAULT_LANGUAGE = mainConfig.defaults.language;

function makeStore() {
    return configureStore({reducer: {language: languageReducer}});
}

type LanguageState = {language: {languageCode: string}};

/** Records every language code it renders with, to catch a default-language first render. */
function LanguageProbe({seen}: {seen: string[]}) {
    const languageCode = useSelector((state: LanguageState) => state.language.languageCode);
    seen.push(languageCode);
    return <span data-testid="language">{languageCode}</span>;
}

function renderProvider(store = makeStore()) {
    const seen: string[] = [];
    render(
        <Provider store={store}>
            <LanguageProvider>
                <LanguageProbe seen={seen}/>
            </LanguageProvider>
        </Provider>,
    );
    return {store, seen};
}

beforeEach(() => {
    localStorage.clear();
    resetLocalStorageMemoryFallback();
    document.documentElement.lang = "en";
    vi.restoreAllMocks();
});

describe("isSupportedLanguageCode", () => {
    it("accepts configured languages only", () => {
        expect(isSupportedLanguageCode("de-CH")).toBe(true);
        expect(isSupportedLanguageCode("xx-XX")).toBe(false);
        expect(isSupportedLanguageCode(null)).toBe(false);
    });
});

describe("LanguageProvider", () => {
    it("hydrates the persisted language before children ever render", () => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, "de-CH");

        const {store, seen} = renderProvider();

        expect(store.getState().language.languageCode).toBe("de-CH");
        expect(seen).toEqual(["de-CH"]);
        expect(screen.getByTestId("language")).toHaveTextContent("de-CH");
    });

    it("ignores an unsupported persisted language", () => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, "xx-XX");

        const {store, seen} = renderProvider();

        expect(store.getState().language.languageCode).toBe(DEFAULT_LANGUAGE);
        expect(seen).toEqual([DEFAULT_LANGUAGE]);
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(DEFAULT_LANGUAGE);
    });

    it("persists the default when nothing is stored", () => {
        renderProvider();

        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(DEFAULT_LANGUAGE);
    });

    it("does not overwrite the stored language with the default before hydrating", () => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, "fr-FR");
        const setItem = vi.spyOn(Storage.prototype, "setItem");

        renderProvider();

        const writtenValues = setItem.mock.calls.filter(([key]) => key === LANGUAGE_STORAGE_KEY).map(([, value]) => value);
        expect(writtenValues).not.toContain(DEFAULT_LANGUAGE);
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("fr-FR");
    });

    it("persists later changes and mirrors them onto <html lang>", () => {
        const {store} = renderProvider();
        expect(document.documentElement.lang).toBe(DEFAULT_LANGUAGE);

        act(() => {
            store.dispatch(changeLanguage("sq-AL"));
        });

        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("sq-AL");
        expect(document.documentElement.lang).toBe("sq-AL");
        expect(screen.getByTestId("language")).toHaveTextContent("sq-AL");
    });

    it("does not persist an unsupported language dispatched into the store", () => {
        const {store} = renderProvider();

        act(() => {
            store.dispatch(changeLanguage("xx-XX"));
        });

        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(DEFAULT_LANGUAGE);
        expect(document.documentElement.lang).toBe(DEFAULT_LANGUAGE);
    });

    it("follows valid language changes made in another tab", () => {
        const {store} = renderProvider();

        writeFromAnotherTab(LANGUAGE_STORAGE_KEY, "it-IT");
        expect(store.getState().language.languageCode).toBe("it-IT");

        writeFromAnotherTab(LANGUAGE_STORAGE_KEY, "xx-XX");
        writeFromAnotherTab("unrelated", "de-CH");
        expect(store.getState().language.languageCode).toBe("it-IT");
    });

    it("renders with the default language when storage is unavailable", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new DOMException("blocked", "SecurityError");
        });

        const {store} = renderProvider();

        expect(store.getState().language.languageCode).toBe(DEFAULT_LANGUAGE);
        expect(screen.getByTestId("language")).toHaveTextContent(DEFAULT_LANGUAGE);
    });
});
