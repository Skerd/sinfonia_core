import {createSlice, type PayloadAction} from "@reduxjs/toolkit";
import {ServerHealthFormResponseType} from "armonia/src/modules/core/api/auxiliary/private/serverHealth/serverHealth.dto.ts";
import {ServerStatsFormResponseType} from "armonia/src/modules/core/api/auxiliary/private/serverStats/serverStats.dto.ts";

/**
 * Canonical slice name used in generated action types.
 */
const SLICE_NAME = "serverResources";

/**
 * Shape for server-related resources consumed by the admin online panels.
 *
 * Notes:
 * - `serverHealth` and `serverStats` are always initialized with safe defaults so
 *   selectors can read deeply nested fields without null guards.
 * - `*LastUpdate` stores the local timestamp of the last reducer update.
 */
export interface ServerResourceState {
    serverHealth: ServerHealthFormResponseType;
    serverHealthLastUpdate: number;
    serverStats: ServerStatsFormResponseType;
    serverStatsLastUpdate: number;
}

/**
 * Produces a fresh default circuit breaker snapshot.
 */
type CircuitBreakerStats = NonNullable<ServerHealthFormResponseType["services"]>["mongoDb"]["circuitBreaker"];
const createDefaultCircuitBreaker = (): CircuitBreakerStats => ({
    state: "CLOSED",
    failures: 0,
    successes: 0,
    lastFailureTime: 0,
    lastSuccessTime: 0,
    totalRequests: 0,
    totalFailures: 0,
    totalSuccesses: 0
});

/**
 * Produces a fresh default health payload.
 * Keeping this in a factory avoids shared references on resets.
 */
const createInitialServerHealth = (): ServerHealthFormResponseType => ({
        status: "error",
        timestamp: 0,
        version: "-",
        services: {
            mongoDb: {
                lastStart: 0,
                connected: false,
                readyState: 0,
                host: "",
                name: "",
                dbSize: 0,
                storageSize: 0,
                indexSize: 0,
                poolStats: {
                    maxPoolSize: 0,
                    minPoolSize: 0,
                    currentConnections: 0,
                    availableConnections: 0,
                    utilizationPercent: 0,
                    waitingRequests: 0
                },
                circuitBreaker: createDefaultCircuitBreaker()
            },
            redis: {
                lastStart: 0,
                connected: false,
                isReady: false,
                ping: false,
                failedJobs: 0,
                completedJobs: 0,
                totalTime: 0,
                circuitBreaker: createDefaultCircuitBreaker()
            },
            kafka: {
                lastStart: 0,
                connected: false,
                enabled: false,
                failedJobs: 0,
                completedJobs: 0,
                totalTime: 0,
                circuitBreaker: createDefaultCircuitBreaker()
            },
            websocket: {
                lastStart: 0,
                connected: false,
                readyState: 0,
                rooms: [],
                users: 0,
                messages: 0,
                failedJobs: 0,
                totalTime: 0,
                url: "",
                serverId: "",
                circuitBreaker: createDefaultCircuitBreaker()
            },
            telegram: {
                lastStart: 0,
                lastHeartbeat: 0,
                connected: false,
                botName: "",
                serverId: "",
                messages: 0,
                users: 0,
                failed: 0,
                totalMs: 0,
                averageMs: 0,
                circuitBreaker: createDefaultCircuitBreaker()
            }
        }
});

/**
 * Produces a fresh default stats payload.
 */
const createInitialServerStats = (): ServerStatsFormResponseType => ({
        timestamp: "",
        summary: {
            totalMetrics: 0,
            uniqueEndpoints: 0,
            totalEndpointsTracked: 0
        },
        endpoints: {
            slowest: [],
            mostCalled: [],
            highestErrorRate: [],
            all: []
        },
        websocket: {
            totalUsers: 0,
            totalConnections: 0,
            totalRooms: 0,
            rooms: []
        }
});

/**
 * Factory for the full slice initial state.
 */
const createInitialServerResourceState = (): ServerResourceState => ({
    serverHealth: createInitialServerHealth(),
    serverHealthLastUpdate: 0,
    serverStats: createInitialServerStats(),
    serverStatsLastUpdate: 0
});

const initialState: ServerResourceState = createInitialServerResourceState();

export const serverResourceSlice = createSlice({
    name: SLICE_NAME,
    initialState,
    reducers: {
        /**
         * Replaces server health snapshot from API/WebSocket updates.
         */
        updateServerHealth: (state, action: PayloadAction<ServerHealthFormResponseType>) => {
            state.serverHealth = action.payload;
            state.serverHealthLastUpdate = Date.now();
        },
        /**
         * Replaces server stats snapshot from API/WebSocket updates.
         */
        updateServerStats: (state, action: PayloadAction<ServerStatsFormResponseType>) => {
            state.serverStats = action.payload;
            state.serverStatsLastUpdate = Date.now();
        },
        /**
         * Resets this slice to its default bootstrap state.
         */
        resetServerResourceState: () => {
            return createInitialServerResourceState();
        }
    }
});

export const {resetServerResourceState, updateServerHealth, updateServerStats} = serverResourceSlice.actions;
export default serverResourceSlice.reducer;