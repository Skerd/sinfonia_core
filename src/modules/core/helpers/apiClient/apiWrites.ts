declare module "axios" {
    interface AxiosRequestConfig {
        /** A read sent as POST that the response cache keeps (`HttpRequest.cache`): its success is not a write. */
        cachedRead?: boolean;
    }
}

/*
 * Every successful write `apiClient` sends (any method but GET, except cached reads), wherever it comes from: a hook, a
 * form, the cart or the checkout calling `apiClient` directly. The response cache listens, so an answer kept from
 * before a write is always asked again (a new order is never missing from "my orders").
 */
const listeners = new Set<() => void>();

export function noteApiWrite(): void {
    listeners.forEach((listener) => listener());
}

export function onApiWrite(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
