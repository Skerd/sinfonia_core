import {compose} from "redux";
import {Link} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle} from "@coreModule/components/ui/empty.tsx";
import {usePortalTitle} from "../shared/portalTitle.ts";

function PortalNotFound({resolveLanguageKey}: WithLanguageType) {
    usePortalTitle(resolveLanguageKey("title"));
    return (
        <Empty className="site-container py-24">
            <EmptyHeader>
                <p className="font-display text-sm font-semibold tracking-widest text-muted-foreground uppercase">404</p>
                <EmptyTitle className="font-display text-4xl font-bold tracking-tight">{resolveLanguageKey("title")}</EmptyTitle>
                <EmptyDescription>{resolveLanguageKey("description")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
                <Button asChild size="lg" className="px-5">
                    <Link to="/">{resolveLanguageKey("home")}</Link>
                </Button>
            </EmptyContent>
        </Empty>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/notFound/index.tsx"))(PortalNotFound);
