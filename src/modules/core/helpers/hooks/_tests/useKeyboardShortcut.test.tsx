import {fireEvent, renderHook} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";

const press = (init: KeyboardEventInit, target: Window | Element = window) => {
    const event = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, ...init});
    fireEvent(target, event);
    return event;
};

describe("useKeyboardShortcuts", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = "";
    });

    it("fires on Meta+key and on Ctrl+key, case-insensitively, and prevents the default", () => {
        const callback = vi.fn();
        renderHook(() => useKeyboardShortcuts("k", callback));

        const event = press({key: "k", metaKey: true});
        press({key: "K", ctrlKey: true});

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.mock.calls[0][0]).toBe(event);
        expect(event.defaultPrevented).toBe(true);
    });

    it("matches named keys such as Backspace", () => {
        const callback = vi.fn();
        renderHook(() => useKeyboardShortcuts("Backspace", callback));

        press({key: "Backspace", metaKey: true});
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it("ignores the key without Meta/Ctrl, and a different key", () => {
        const callback = vi.fn();
        renderHook(() => useKeyboardShortcuts("k", callback));

        const plain = press({key: "k"});
        press({key: "j", metaKey: true});

        expect(callback).not.toHaveBeenCalled();
        expect(plain.defaultPrevented).toBe(false);
    });

    it("requires Shift/Alt to match the options exactly", () => {
        const plain = vi.fn();
        const shifted = vi.fn();
        const alted = vi.fn();
        renderHook(() => useKeyboardShortcuts("e", plain));
        renderHook(() => useKeyboardShortcuts("e", shifted, {shift: true}));
        renderHook(() => useKeyboardShortcuts("e", alted, {alt: true}));

        press({key: "E", metaKey: true, shiftKey: true});
        expect(plain).not.toHaveBeenCalled();
        expect(shifted).toHaveBeenCalledTimes(1);
        expect(alted).not.toHaveBeenCalled();

        press({key: "e", metaKey: true, altKey: true});
        expect(alted).toHaveBeenCalledTimes(1);
        expect(plain).not.toHaveBeenCalled();
    });

    it("ignores key repeat and IME composition", () => {
        const callback = vi.fn();
        renderHook(() => useKeyboardShortcuts("k", callback));

        press({key: "k", metaKey: true, repeat: true});
        press({key: "k", metaKey: true, isComposing: true});

        expect(callback).not.toHaveBeenCalled();
    });

    it("skips events another handler already prevented, so only the first matching shortcut runs", () => {
        const first = vi.fn();
        const second = vi.fn();
        renderHook(() => useKeyboardShortcuts("k", first));
        renderHook(() => useKeyboardShortcuts("k", second));

        press({key: "k", metaKey: true});

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).not.toHaveBeenCalled();
    });

    it.each(["input", "textarea", "select"])("ignores events from a focused <%s> by default", (tag) => {
        const callback = vi.fn();
        renderHook(() => useKeyboardShortcuts("k", callback));
        const field = document.body.appendChild(document.createElement(tag));

        const event = press({key: "k", metaKey: true}, field);

        expect(callback).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
    });

    it("ignores events from contenteditable elements by default", () => {
        const callback = vi.fn();
        renderHook(() => useKeyboardShortcuts("k", callback));
        const editable = document.body.appendChild(document.createElement("div"));
        // jsdom does not implement isContentEditable, so define it explicitly.
        Object.defineProperty(editable, "isContentEditable", {value: true});

        press({key: "k", metaKey: true}, editable);
        expect(callback).not.toHaveBeenCalled();
    });

    it("fires from editable fields when allowInEditable is set", () => {
        const callback = vi.fn();
        renderHook(() => useKeyboardShortcuts("k", callback, {allowInEditable: true}));
        const input = document.body.appendChild(document.createElement("input"));

        press({key: "k", metaKey: true}, input);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it("does not listen or prevent the default while disabled, and starts when enabled", () => {
        const callback = vi.fn();
        const {rerender} = renderHook(
            ({enabled}) => useKeyboardShortcuts("k", callback, {enabled}),
            {initialProps: {enabled: false}},
        );

        const event = press({key: "k", metaKey: true});
        expect(callback).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);

        rerender({enabled: true});
        press({key: "k", metaKey: true});
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it("calls the latest callback without re-subscribing on re-render", () => {
        const addSpy = vi.spyOn(window, "addEventListener");
        const first = vi.fn();
        const second = vi.fn();
        const {rerender} = renderHook(
            ({callback}) => useKeyboardShortcuts("k", callback),
            {initialProps: {callback: first}},
        );

        rerender({callback: second});
        rerender({callback: second});
        press({key: "k", metaKey: true});

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
        expect(addSpy.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(1);
    });

    it("re-subscribes when the key changes", () => {
        const callback = vi.fn();
        const {rerender} = renderHook(
            ({key}) => useKeyboardShortcuts(key, callback),
            {initialProps: {key: "k"}},
        );

        rerender({key: "j"});
        press({key: "k", metaKey: true});
        expect(callback).not.toHaveBeenCalled();

        press({key: "j", metaKey: true});
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it("removes the listener on unmount", () => {
        const callback = vi.fn();
        const {unmount} = renderHook(() => useKeyboardShortcuts("k", callback));

        unmount();
        press({key: "k", metaKey: true});
        expect(callback).not.toHaveBeenCalled();
    });
});
