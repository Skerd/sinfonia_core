import {act, renderHook, waitFor} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ReactNode} from "react";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import languageReducer, {changeLanguage} from "@baseModule/helpers/redux/slices/languageSlice.ts";
import deCHErrorBoundary from "@coreModule/assets/languages/de-CH/components/custom/errorBoundary.json";
import enUSErrorBoundary from "@coreModule/assets/languages/en-US/components/custom/errorBoundary.json";
import useSelectedLanguage, {
    componentLanguageLoader,
    convertComponentPathToLanguagePath,
    createComponentLanguageLoader,
    type LanguageModuleLoader,
    localeJsonStemFromSourcePath,
} from "@baseModule/helpers/hooks/useSelectedLanguage.ts";

const ROOT = "/src/modules";

describe("path helpers", () => {
    it("reduces a source path to the stem inside its package", () => {
        expect(localeJsonStemFromSourcePath("src/modules/core/components/custom/errorBoundary.tsx")).toBe("components/custom/errorBoundary");
        expect(localeJsonStemFromSourcePath("/src/modules/eCommerce/clients/cart/index.ts")).toBe("clients/cart/index");
        expect(localeJsonStemFromSourcePath("src\\modules\\core\\a\\b.jsx")).toBe("a/b");
    });

    it("keeps legacy module-relative paths, minus the extension", () => {
        expect(localeJsonStemFromSourcePath("components/custom/legacy.tsx")).toBe("components/custom/legacy");
        expect(localeJsonStemFromSourcePath("  /components/x  ")).toBe("components/x");
    });

    it("builds the locale JSON path", () => {
        expect(convertComponentPathToLanguagePath("components/a", "de-CH", "src/modules/core/assets/languages"))
            .toBe("src/modules/core/assets/languages/de-CH/components/a.json");
        expect(convertComponentPathToLanguagePath("components/a.tsx", "en-US", "/root")).toBe("/root/en-US/components/a.json");
    });
});

describe("createComponentLanguageLoader", () => {
    const file = (pkg: string, locale: string, stem: string) => `${ROOT}/${pkg}/assets/languages/${locale}/${stem}.json`;
    const loaderOf = (value: unknown): LanguageModuleLoader => vi.fn(async () => value as Record<string, unknown>);

    it("loads the requested locale, strips `path` and applies the transform with that locale", async () => {
        const transform = vi.fn((dictionary: Record<string, unknown>, code: string) => ({...dictionary, locale: code}));
        const loader = createComponentLanguageLoader({
            glob: {[file("core", "de-CH", "components/a")]: loaderOf({path: "src/x.tsx", title: "Titel"})},
            defaultLanguageCode: "en-US",
            transform,
        });

        const result = await loader.load("src/modules/core/components/a.tsx", "de-CH");

        expect(result).toEqual({dictionary: {title: "Titel", locale: "de-CH"}, failed: false});
    });

    it("falls back to the default locale, then en-US", async () => {
        const loader = createComponentLanguageLoader({
            glob: {
                [file("core", "it-IT", "components/a")]: loaderOf({title: "default"}),
                [file("core", "en-US", "components/b")]: loaderOf({title: "english"}),
            },
            defaultLanguageCode: "it-IT",
        });

        expect((await loader.load("src/modules/core/components/a.tsx", "fr-FR")).dictionary).toEqual({title: "default"});
        expect((await loader.load("src/modules/core/components/b.tsx", "fr-FR")).dictionary).toEqual({title: "english"});
    });

    it("reads only the component's own package, even when another package has the same relative file", async () => {
        const coreLoader = loaderOf({owner: "core"});
        const shopLoader = loaderOf({owner: "eCommerce"});
        const loader = createComponentLanguageLoader({
            glob: {[file("core", "en-US", "shared/x")]: coreLoader, [file("eCommerce", "en-US", "shared/x")]: shopLoader},
            defaultLanguageCode: "en-US",
        });

        expect((await loader.load("src/modules/eCommerce/shared/x.tsx", "en-US")).dictionary).toEqual({owner: "eCommerce"});
        expect(coreLoader).not.toHaveBeenCalled();

        expect((await loader.load("src/modules/billing/shared/x.tsx", "en-US")).dictionary).toEqual({});
    });

    it("matches glob keys written as absolute OS paths", async () => {
        const loader = createComponentLanguageLoader({
            glob: {"C:\\repo\\sinfonia\\src\\modules\\core\\assets\\languages\\en-US\\components\\a.json": loaderOf({ok: true})},
            defaultLanguageCode: "en-US",
        });

        expect((await loader.load("src/modules/core/components/a.tsx", "en-US")).dictionary).toEqual({ok: true});
    });

    it("tries every package root, in path order, for legacy stems", async () => {
        const loader = createComponentLanguageLoader({
            glob: {
                [file("zeta", "en-US", "legacy/thing")]: loaderOf({from: "zeta"}),
                [file("alpha", "en-US", "other/file")]: loaderOf({from: "alpha-other"}),
                [file("beta", "en-US", "legacy/thing")]: loaderOf({from: "beta"}),
            },
            defaultLanguageCode: "en-US",
        });

        expect((await loader.load("legacy/thing.tsx", "en-US")).dictionary).toEqual({from: "beta"});
    });

    it("shares one load between concurrent callers and serves later calls from the cache", async () => {
        const fileLoader = loaderOf({title: "once"});
        const loader = createComponentLanguageLoader({glob: {[file("core", "en-US", "a")]: fileLoader}, defaultLanguageCode: "en-US"});
        const path = "src/modules/core/a.tsx";

        expect(loader.peek(path, "en-US")).toBeUndefined();
        const [first, second] = await Promise.all([loader.load(path, "en-US"), loader.load(path, "en-US")]);
        await loader.load(path, "en-US");

        expect(fileLoader).toHaveBeenCalledTimes(1);
        expect(first.dictionary).toBe(second.dictionary);
        expect(loader.peek(path, "en-US")).toBe(first.dictionary);

        loader.clear();
        expect(loader.peek(path, "en-US")).toBeUndefined();
    });

    it("caches a missing file as an empty dictionary", async () => {
        const loader = createComponentLanguageLoader({glob: {}, defaultLanguageCode: "en-US"});

        expect(await loader.load("src/modules/core/missing.tsx", "en-US")).toEqual({dictionary: {}, failed: false});
        expect(loader.peek("src/modules/core/missing.tsx", "en-US")).toEqual({});
    });

    it("falls back past a loader that throws, and does not cache a total failure so it can retry", async () => {
        const flaky = vi.fn<LanguageModuleLoader>()
            .mockRejectedValueOnce(new Error("chunk failed"))
            .mockResolvedValueOnce({title: "recovered"});
        const loader = createComponentLanguageLoader({
            glob: {
                [file("core", "de-CH", "a")]: vi.fn(async () => { throw new Error("broken"); }),
                [file("core", "en-US", "a")]: loaderOf({title: "english"}),
                [file("core", "en-US", "b")]: flaky,
            },
            defaultLanguageCode: "en-US",
        });

        expect(await loader.load("src/modules/core/a.tsx", "de-CH")).toEqual({dictionary: {title: "english"}, failed: false});

        expect(await loader.load("src/modules/core/b.tsx", "en-US")).toEqual({dictionary: {}, failed: true});
        expect(loader.peek("src/modules/core/b.tsx", "en-US")).toBeUndefined();
        expect(await loader.load("src/modules/core/b.tsx", "en-US")).toEqual({dictionary: {title: "recovered"}, failed: false});
    });
});

describe("useSelectedLanguage", () => {
    const COMPONENT = "src/modules/core/components/custom/errorBoundary.tsx";
    const {path: _enPath, ...enUS} = enUSErrorBoundary;
    const {path: _dePath, ...deCH} = deCHErrorBoundary;

    function setup(componentPath = COMPONENT, languageCode = "en-US") {
        const store = configureStore({reducer: {language: languageReducer}});
        store.dispatch(changeLanguage(languageCode));
        const wrapper = ({children}: {children: ReactNode}) => <Provider store={store}>{children}</Provider>;
        const firstRender: unknown[] = [];
        const view = renderHook(() => {
            const result = useSelectedLanguage(componentPath);
            if (firstRender.length === 0) firstRender.push(result);
            return result;
        }, {wrapper});
        return {...view, store, firstRender};
    }

    beforeEach(() => {
        componentLanguageLoader.clear();
    });

    it("loads the component dictionary for the store's language, without metadata", async () => {
        const {result} = setup();
        expect(result.current.loading).toBe(true);
        expect(result.current.currentLanguage).toBeNull();

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.currentLanguage).toMatchObject(enUS);
        expect(result.current.languageCode).toBe("en-US");
        // Module menu contributions are merged in too, so match the file's keys rather than the whole object.
        expect(result.current.currentLanguage).not.toHaveProperty("path");
        expect(result.current.error).toBe(false);
        expect(result.current.errorDescription).toBe("");
    });

    it("returns an already-loaded dictionary on the first render", async () => {
        await componentLanguageLoader.load(COMPONENT, "en-US");
        const {firstRender} = setup();

        expect(firstRender[0]).toMatchObject({loading: false, currentLanguage: enUS});
    });

    it("keeps the previous dictionary while switching language, then shows the new one", async () => {
        const {result, store} = setup();
        await waitFor(() => expect(result.current.currentLanguage).toMatchObject(enUS));

        act(() => {
            store.dispatch(changeLanguage("de-CH"));
        });
        expect(result.current.loading).toBe(true);
        expect(result.current.currentLanguage).toMatchObject(enUS);

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.currentLanguage).toMatchObject(deCH);
    });

    it("returns an empty dictionary for a component without language files", async () => {
        const {result} = setup("src/modules/core/components/custom/doesNotExist.tsx");
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.currentLanguage).toEqual({});
        expect(result.current.error).toBe(false);
    });

    it("does nothing without a path", () => {
        const {result} = setup("");
        expect(result.current).toEqual({languageCode: "en-US", loading: false, error: false, errorDescription: "", currentLanguage: null});
    });
});
