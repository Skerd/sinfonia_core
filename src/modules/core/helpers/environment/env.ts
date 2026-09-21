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
    VITE_API_BASE_URL: z.string().optional(),
    VITE_WS_BASE_URL: z.string().optional(),
    VITE_DEBUG_HTTP: boolFromEnv.default(false),
    VITE_DEBUG_WS: boolFromEnv.default(false),
    VITE_DEBUG_UI: boolFromEnv.default(false),
});

export type AppEnv = z.infer<typeof envSchema>;

export const env: AppEnv = envSchema.parse(import.meta.env);
