// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import {afterEach, describe, expect, it, vi} from "vitest";
import {resolveEnabledModules} from "../../../../../../scripts/enabledModules.ts";

const sinfoniaRoot = path.join(__dirname, "../../../../../..");
const manifestPath = path.resolve(sinfoniaRoot, "../maestro/modules/core/modules.manifest.json");

describe("resolveEnabledModules reads the manifest in maestro core (D01a)", () => {
    afterEach(() => vi.restoreAllMocks());

    it("adds a module's dependencies from that manifest", () => {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as Record<string, {dependsOn?: string[]}>;
        const [name, entry] = Object.entries(manifest).find(([, value]) => (value.dependsOn ?? []).some((dep) => dep !== "core")) ?? [];
        expect(name).toBeDefined();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

        const modules = resolveEnabledModules(name, sinfoniaRoot) ?? [];

        expect(modules).toEqual(expect.arrayContaining([name, ...(entry?.dependsOn ?? [])]));
        expect(warn.mock.calls.flat().join(" ")).not.toContain("modules.manifest.json not found");
    });
});
