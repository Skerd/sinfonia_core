import environmentConfig from "@coreModule/environment/environment.json";

export type ClientConfig = typeof environmentConfig;

/** The client configuration bundled from `environment/environment.json`. */
export function getClientConfig(): ClientConfig {
    return environmentConfig;
}
