import {describe, expect, it} from "vitest";
import {buildWebSocketUrl, reconnectDelay, shouldReconnect} from "@coreModule/helpers/websocket/webSocketConnection.ts";

describe("buildWebSocketUrl", () => {
    it("matches the page protocol", () => {
        expect(buildWebSocketUrl("abc.def.ghi", "en-US", {protocol: "https:", host: "app.example.com"}))
            .toBe("wss://app.example.com/ws/abc.def.ghi/en-US");
        expect(buildWebSocketUrl("abc.def.ghi", "de-CH", {protocol: "http:", host: "localhost:5173"}))
            .toBe("ws://localhost:5173/ws/abc.def.ghi/de-CH");
    });

    it("encodes path segments", () => {
        expect(buildWebSocketUrl("a/b?c", "x y", {protocol: "https:", host: "h"})).toBe("wss://h/ws/a%2Fb%3Fc/x%20y");
    });

    it("defaults to window.location", () => {
        expect(buildWebSocketUrl("t", "en-US")).toBe(`ws://${window.location.host}/ws/t/en-US`);
    });
});

describe("reconnectDelay", () => {
    const noJitter = () => 0;

    it("doubles from one second and caps at thirty", () => {
        expect([0, 1, 2, 3, 4, 5, 6, 20].map((attempt) => reconnectDelay(attempt, noJitter)))
            .toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000]);
    });

    it("adds under one second of jitter", () => {
        expect(reconnectDelay(0, () => 0.999)).toBe(1999);
        expect(reconnectDelay(20, () => 0.5)).toBe(30500);
    });
});

describe("shouldReconnect", () => {
    const close = (code: number) => ({code}) as CloseEvent;

    it.each([1000, 1008])("stops after close code %i", (code) => {
        expect(shouldReconnect(close(code))).toBe(false);
    });

    it.each([1001, 1005, 1006, 1011, 1012, 4000])("reconnects after close code %i", (code) => {
        expect(shouldReconnect(close(code))).toBe(true);
    });
});
