import {createContext, useCallback, useContext, useMemo, useState, type ReactNode} from "react";
import {compose} from "redux";
import {useLocation, useNavigate} from "react-router-dom";
import {IconHeart, IconHeartFilled} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {requestFromApi} from "@coreModule/helpers/apiClient/requestFromApi.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import type {PortalCatalogItem} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import type {PortalFavouriteKeysResponse} from "armonia/src/modules/core/api/portal/private/saved/portalSaved.dto.ts";
import {usePortalSession} from "./portalSession.tsx";

/** What keeping an item needs: a card's item, or a detail page's own (TD-F148). */
export type PortalKeepItem = Pick<PortalCatalogItem, "kind" | "id" | "section" | "path" | "title">;

type PortalSavedValue = {
    /** Keeping items and saving searches need an account. */
    signedIn: boolean;
    isKept: (item: Pick<PortalCatalogItem, "kind" | "id">) => boolean;
    /** Keeps the item, or drops it when kept. */
    toggleKept: (item: PortalKeepItem) => Promise<void>;
    /** Sends a signed-out visitor to sign in, and back to this page after. */
    signIn: () => void;
};

const KEYS_REQUEST = {method: "post" as const, url: "/api/portal/saved/favourites/keys", data: {}};

const keyOf = (item: Pick<PortalCatalogItem, "kind" | "id">) => `${item.kind}:${item.id}`;

/** Outside the provider (a page rendered on its own), nothing is kept and nothing can be. */
const PortalSavedContext = createContext<PortalSavedValue>({
    signedIn: false,
    isKept: () => false,
    toggleKept: async () => undefined,
    signIn: () => undefined,
});

/**
 * What the signed-in visitor keeps (D178, P23.7): the hearts on every catalog card read and change it here. The kept
 * items are loaded once per account; a heart changes at once and follows the server's answer.
 */
export function PortalSavedProvider({children}: {children: ReactNode}) {
    const {isAuthenticated, user} = usePortalSession();
    const navigate = useNavigate();
    const {pathname, search} = useLocation();
    const [kept, setKept] = useState<ReadonlySet<string>>(new Set());

    // One load per account that signs in; signing out forgets the hearts.
    const account = isAuthenticated ? String(user.id) : null;
    const [load, setLoad] = useState({account, count: account ? 1 : 0});
    if (load.account !== account) {
        setLoad({account, count: account ? load.count + 1 : load.count});
        if (!account) setKept(new Set());
    }
    useHttpRequest<PortalFavouriteKeysResponse>(KEYS_REQUEST, {}, load.count, true, {
        success: (data) => setKept(new Set(data.data)),
    });

    const signIn = useCallback(() => {
        navigate(`/login?next=${encodeURIComponent(`${pathname}${search}`)}`);
    }, [navigate, pathname, search]);

    const toggleKept = useCallback(async (item: PortalKeepItem) => {
        if (!account) {
            signIn();
            return;
        }
        const key = keyOf(item);
        const keeping = !kept.has(key);
        setKept((current) => {
            const next = new Set(current);
            if (keeping) next.add(key); else next.delete(key);
            return next;
        });
        try {
            const response = await requestFromApi<PortalFavouriteKeysResponse>(keeping
                ? {method: "put", url: "/api/portal/saved/favourites", data: {kind: item.kind, id: item.id, section: item.section, path: item.path}}
                : {method: "delete", url: "/api/portal/saved/favourites", data: {kind: item.kind, id: item.id}});
            setKept(new Set(response.data));
        } catch {
            // The failure toast is shown; the heart goes back to what the server has.
            setKept((current) => {
                const next = new Set(current);
                if (keeping) next.delete(key); else next.add(key);
                return next;
            });
        }
    }, [account, kept, signIn]);

    const value = useMemo<PortalSavedValue>(() => ({
        signedIn: Boolean(account),
        isKept: (item) => kept.has(keyOf(item)),
        toggleKept,
        signIn,
    }), [account, kept, toggleKept, signIn]);

    return <PortalSavedContext.Provider value={value}>{children}</PortalSavedContext.Provider>;
}

export function usePortalSaved(): PortalSavedValue {
    return useContext(PortalSavedContext);
}

/** The heart on a card and on an item's page: keeps the item in the visitor's Saved tab; signed out, it asks them to sign in first. */
function KeepButton({item, className, resolveLanguageKey}: WithLanguageType & {item: PortalKeepItem; className?: string}) {
    const {isKept, toggleKept} = usePortalSaved();
    const kept = isKept(item);
    const label = String(resolveLanguageKey(kept ? "unkeep" : "keep")).replace("{title}", item.title);
    return (
        <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-pressed={kept}
            aria-label={label}
            title={label}
            className={cn("rounded-full bg-background/90 shadow-sm backdrop-blur hover:bg-background", className)}
            onClick={() => void toggleKept(item)}
        >
            {kept ? <IconHeartFilled className="text-rose-600" aria-hidden /> : <IconHeart aria-hidden />}
        </Button>
    );
}

export const PortalKeepButton = compose(withLanguage("src/modules/core/clients/portal/shared/portalSaved.tsx"))(KeepButton);
