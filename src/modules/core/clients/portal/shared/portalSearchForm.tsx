import {compose} from "redux";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Search} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {PORTAL_BUTTON, PORTAL_INPUT} from "./portalStyles.ts";

type PortalSearchFormProps = WithLanguageType & {
    initialQuery?: string;
    initialCity?: string;
};

/** "What" and "where", searched across every section on `/search`. */
function PortalSearchForm({initialQuery = "", initialCity = "", resolveLanguageKey}: PortalSearchFormProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState(initialQuery);
    const [city, setCity] = useState(initialCity);

    return (
        <form
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
            onSubmit={(event) => {
                event.preventDefault();
                const params = new URLSearchParams();
                if (query.trim()) params.set("q", query.trim());
                if (city.trim()) params.set("city", city.trim());
                navigate(`/search?${params.toString()}`);
            }}
        >
            <label className="sr-only" htmlFor="portal-search-what">{resolveLanguageKey("what")}</label>
            <input id="portal-search-what" className={PORTAL_INPUT} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={resolveLanguageKey("whatPlaceholder")} />
            <label className="sr-only" htmlFor="portal-search-where">{resolveLanguageKey("where")}</label>
            <input id="portal-search-where" className={PORTAL_INPUT} value={city} onChange={(e) => setCity(e.target.value)} placeholder={resolveLanguageKey("wherePlaceholder")} />
            <button type="submit" className={PORTAL_BUTTON} disabled={!query.trim() && !city.trim()}>
                <Search size={18} aria-hidden />
                {resolveLanguageKey("search")}
            </button>
        </form>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/shared/portalSearchForm.tsx"))(PortalSearchForm);
