import {z} from "zod";

const boolFromEnv = z.preprocess((value) => {
    if (typeof value === "string") {
        return value === "true" || value === "1";
    }
    if (typeof value === "boolean") {
        return value;
    }
    return false;
}, z.boolean());

const envSchema = z.object({
    MODE: z.string().default("development"),
    DEV: z.boolean().default(false),
    PROD: z.boolean().default(false),
    BASE_URL: z.string().default("/"),
    VITE_DEBUG_HTTP: boolFromEnv.default(false),
    VITE_DEBUG_WS: boolFromEnv.default(false),
    VITE_DEBUG_UI: boolFromEnv.default(false),
    /** Portal build only: the zone apex (`arpeggio.al`) whose apex and company sites share one session. */
    VITE_PORTAL_ROOT_DOMAIN: z.string().default(""),
    /** Studio only: the panel's origin (`http://localhost:5173`), so links to panel pages leave the studio. Empty in the panel. */
    VITE_PANEL_URL: z.string().default(""),
});

export type AppEnv = z.infer<typeof envSchema>;

export const env: AppEnv = envSchema.parse(import.meta.env);
