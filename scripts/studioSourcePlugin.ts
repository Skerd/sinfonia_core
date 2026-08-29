import fs from "node:fs";
import path from "node:path";
import type {Connect, Plugin, ViteDevServer} from "vite";
import {buildSourceIndex, type SourceIndex} from "./studioSourceIndex.ts";
import {applySourceEdits, type ApplyRequest} from "./studioSourceEdits.ts";

/**
 * Serves the Studio's source index, and applies edits back to `*.views.ts`.
 *
 * This lives in the Vite dev server rather than in maestro on purpose. It is developer
 * tooling that writes to the repository, so it should exist only while someone is running
 * `npm run studio` on their own machine — never in a deployed API, and never in a
 * production bundle. `apply: "serve"` plus the `enabled` gate below give both.
 */

const ROUTE_PREFIX = "/__studio/";

export type StudioSourcePluginOptions = {
    /** Absolute path to the maestro checkout. */
    maestroRoot: string;
    /** Register the routes at all. Callers pass `appId === "studio"`. */
    enabled: boolean;
};

function sendJson(response: Parameters<Connect.NextHandleFunction>[1], status: number, body: unknown) {
    const payload = JSON.stringify(body);
    response.statusCode = status;
    response.setHeader("Content-Type", "application/json");
    response.end(payload);
}

async function readJsonBody(request: Connect.IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request) {
        const buffer = chunk as Buffer;
        size += buffer.length;
        /* A view config edit is kilobytes; anything larger is a mistake or an attack. */
        if (size > 2_000_000) throw new Error("Request body too large.");
        chunks.push(buffer);
    }
    if (chunks.length === 0) return {};
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

/**
 * Serialises the index for the client. `resolve` is a function, so the wire format is the
 * flat data the UI actually needs: entries plus the shared groups.
 */
function serialiseIndex(index: SourceIndex) {
    return {
        targets: [...index.byTarget.values()],
        sharedGroups: index.sharedGroups,
        files: index.files.length,
    };
}

export function studioSourcePlugin(options: StudioSourcePluginOptions): Plugin {
    const {maestroRoot, enabled} = options;

    let cached: SourceIndex | null = null;
    const index = (): SourceIndex => {
        if (!cached) cached = buildSourceIndex(maestroRoot);
        return cached;
    };

    return {
        name: "studio-source",
        /* Dev server only. Never part of a build. */
        apply: "serve",

        configureServer(server: ViteDevServer) {
            if (!enabled) return;
            if (!fs.existsSync(path.join(maestroRoot, "modules"))) {
                server.config.logger.warn(
                    `[studio-source] ${maestroRoot}/modules not found — source features disabled.`,
                );
                return;
            }

            /* Any change to a view file invalidates cached offsets. Rebuild lazily rather
               than eagerly: several saves in a row should cost one rebuild, not five. */
            server.watcher.add(path.join(maestroRoot, "modules"));
            const invalidate = (file: string) => {
                if (file.endsWith(".views.ts")) cached = null;
            };
            server.watcher.on("change", invalidate);
            server.watcher.on("add", invalidate);
            server.watcher.on("unlink", invalidate);

            server.middlewares.use(async (request, response, next) => {
                const url = request.url ?? "";
                if (!url.startsWith(ROUTE_PREFIX)) return next();

                const route = url.slice(ROUTE_PREFIX.length).split("?")[0];

                try {
                    if (route === "index" && request.method === "GET") {
                        return sendJson(response, 200, serialiseIndex(index()));
                    }

                    if (route === "resolve" && request.method === "POST") {
                        const body = (await readJsonBody(request)) as {
                            target?: string;
                            nodePath?: string;
                        };
                        if (!body.target) return sendJson(response, 400, {error: "target required"});
                        const ref = index().resolve(body.target, body.nodePath ?? "");
                        return sendJson(response, 200, {ref});
                    }

                    if (route === "apply" && request.method === "POST") {
                        const body = (await readJsonBody(request)) as ApplyRequest;
                        if (!body?.target || !Array.isArray(body.edits)) {
                            return sendJson(response, 400, {
                                error: "target and edits[] are required",
                            });
                        }

                        /* Re-resolve against fresh source: the cached index's offsets are
                           only valid until something else touches the file. */
                        cached = null;
                        /*
                         * Deliberately no formatter. maestro has no prettier config, and
                         * `prettier --check` reports its views files as unformatted — so
                         * running prettier over one would rewrite the whole file and bury a
                         * one-property change in a thousand-line diff. `printValue` already
                         * emits the style the corpus uses; a surgical edit stays surgical.
                         */
                        const result = applySourceEdits(body, {
                            maestroRoot,
                            index: index(),
                        });
                        /* The file changed underneath the index we just built. */
                        cached = null;
                        return sendJson(response, result.ok ? 200 : 409, result);
                    }

                    return sendJson(response, 404, {error: `Unknown studio route ${route}`});
                } catch (error) {
                    server.config.logger.error(`[studio-source] ${(error as Error).message}`);
                    return sendJson(response, 500, {error: (error as Error).message});
                }
            });

            server.config.logger.info(
                `[studio-source] serving ${ROUTE_PREFIX}index and ${ROUTE_PREFIX}apply from ${maestroRoot}`,
            );
        },
    };
}
