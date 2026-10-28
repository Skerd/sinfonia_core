import {compose} from "redux";
import {Link} from "react-router-dom";
import {Facebook, Globe, Instagram, Linkedin, Mail, MapPin, Phone} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import type {PortalCompanyAddress} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import PortalSectionName from "../portalSectionName.tsx";
import {usePortalSite} from "../portalSiteContext.tsx";
import {sectionHref} from "../sectionBase.tsx";

const FOOTER_LINK_CLASS = "inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground";

function addressLabel(address: PortalCompanyAddress): string {
    const cityLine = [address.postalCode, address.city?.name].filter(Boolean).join(" ");
    const locality = [cityLine, address.state?.name].filter(Boolean).join(", ");
    return [address.street, locality, address.country?.name].filter((part): part is string => Boolean(part)).join(", ");
}

function addressMapsHref(address: PortalCompanyAddress, label: string): string {
    const query = address.latitude !== undefined && address.longitude !== undefined
        ? `${address.latitude},${address.longitude}`
        : label;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** The site company's profile: who runs this site, how to reach them, and where to go next. */
function PortalFooter({resolveLanguageKey}: WithLanguageType) {
    const {site, sections} = usePortalSite();
    if (!site) return null;
    const {company} = site;
    const socials = [
        {label: resolveLanguageKey("socialWebsite"), href: company.website, Icon: Globe},
        {label: "LinkedIn", href: company.linkedin, Icon: Linkedin},
        {label: "Instagram", href: company.instagram, Icon: Instagram},
        {label: "Facebook", href: company.facebook, Icon: Facebook},
    ].filter((item): item is {label: string; href: string; Icon: typeof Globe} => Boolean(item.href));

    return (
        <footer className="mt-24 border-t bg-muted/40">
            <div className="site-container grid items-start gap-10 py-14 md:grid-cols-[minmax(0,36rem)_auto] md:justify-between">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        {company.logo
                            ? <img src={company.logo} alt={company.name} className="h-10 w-auto self-start object-contain" />
                            : <p className="font-display text-2xl font-bold tracking-tight">{company.name}</p>}
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {site.scope === "company" ? company.description : resolveLanguageKey("footer")}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        {company.email ? (
                            <a href={`mailto:${company.email}`} className={FOOTER_LINK_CLASS}>
                                <Mail className="size-4 shrink-0" aria-hidden />
                                {company.email}
                            </a>
                        ) : null}
                        {company.phoneNumber ? (
                            <a href={`tel:${company.phoneNumber.replace(/[^\d+]/g, "")}`} className={FOOTER_LINK_CLASS}>
                                <Phone className="size-4 shrink-0" aria-hidden />
                                {company.phoneNumber}
                            </a>
                        ) : null}
                        {(company.addresses ?? []).map((address, index) => {
                            const label = addressLabel(address);
                            return label ? (
                                <a
                                    key={`${address.city?._id ?? index}-${address.street ?? ""}`}
                                    href={addressMapsHref(address, label)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={FOOTER_LINK_CLASS}
                                >
                                    <MapPin className="size-4 shrink-0" aria-hidden />
                                    {label}
                                </a>
                            ) : null;
                        })}
                    </div>
                    {socials.length > 0 ? (
                        <div className="-ml-2 flex items-center gap-1">
                            {socials.map(({label, href, Icon}) => (
                                <Button key={href} asChild variant="ghost" size="icon">
                                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                                        <Icon aria-hidden />
                                    </a>
                                </Button>
                            ))}
                        </div>
                    ) : null}
                    {company.vat ? (
                        <p className="text-xs text-muted-foreground">{resolveLanguageKey("vatLabel")} {company.vat}</p>
                    ) : null}
                </div>
                <nav className="flex flex-col gap-2.5" aria-label={resolveLanguageKey("exploreHeading")}>
                    <p className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{resolveLanguageKey("exploreHeading")}</p>
                    <Link to="/" className={FOOTER_LINK_CLASS}>{resolveLanguageKey("home")}</Link>
                    <Link to="/blog" className={FOOTER_LINK_CLASS}>{resolveLanguageKey("blog")}</Link>
                    {sections.map((section) => (
                        <Link key={section.section} to={sectionHref(section)} className={FOOTER_LINK_CLASS}>
                            <PortalSectionName section={section.section} />
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="border-t">
                <div className="site-container flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} {company.name}</p>
                    {site.scope === "company" ? <p>{resolveLanguageKey("poweredBy")}</p> : null}
                </div>
            </div>
        </footer>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/portal/shared/footer/index.tsx")
)(PortalFooter);
