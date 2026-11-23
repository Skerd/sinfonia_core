import type {ComponentType} from "react";
import {IconWorld, IconBrandLinkedin, IconMail, IconMapPin, IconPhone} from "@tabler/icons-react";
// simple-icons has no LinkedIn mark (removed at LinkedIn's request), so that one stays on tabler.
import {SiFacebook, SiInstagram} from "@icons-pack/react-simple-icons";
import {compose} from "redux";
import {Link} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import type {PortalCompanyAddress} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import PortalSectionName from "../portalSectionName.tsx";
import {usePortalSite} from "../portalSiteContext.tsx";
import {usePortalLandings} from "../portalLandings.ts";
import {sectionHref} from "../sectionBase.tsx";
import {portalApexOrigin} from "../portalZone.ts";
import ThemeSwitch from "@coreModule/components/custom/preferences/themeSwitch.tsx";

const FOOTER_LINK_CLASS = "inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground";
const FOOTER_HEADING_CLASS = "mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase";

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
    const landings = usePortalLandings();
    if (!site) return null;
    const {company} = site;
    const socialLinks: {label: string; href: string | undefined; Icon: ComponentType<{className?: string}>}[] = [
        {label: resolveLanguageKey("socialWebsite"), href: company.website, Icon: IconWorld},
        {label: "LinkedIn", href: company.linkedin, Icon: IconBrandLinkedin},
        {label: "Instagram", href: company.instagram, Icon: SiInstagram},
        {label: "Facebook", href: company.facebook, Icon: SiFacebook},
    ];
    const socials = socialLinks.filter((item): item is (typeof socialLinks)[number] & {href: string} => Boolean(item.href));

    return (
        <footer className="mt-24 border-t bg-muted/40">
            <div className="site-container grid items-start gap-10 py-14 md:grid-cols-[minmax(0,36rem)_auto] md:justify-between">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        {company.logo
                            ? <img src={company.logo} alt={company.name} className="h-10 w-auto self-start rounded-sm object-contain" />
                            : <p className="font-display text-2xl font-bold tracking-tight">{company.name}</p>}
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {site.scope === "company" ? company.description : resolveLanguageKey("footer")}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        {company.email ? (
                            <a href={`mailto:${company.email}`} className={FOOTER_LINK_CLASS}>
                                <IconMail className="size-4 shrink-0" aria-hidden />
                                {company.email}
                            </a>
                        ) : null}
                        {company.phoneNumber ? (
                            <a href={`tel:${company.phoneNumber.replace(/[^\d+]/g, "")}`} className={FOOTER_LINK_CLASS}>
                                <IconPhone className="size-4 shrink-0" aria-hidden />
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
                                    <IconMapPin className="size-4 shrink-0" aria-hidden />
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
                <div className="flex flex-wrap gap-x-12 gap-y-10">
                    <nav className="flex flex-col gap-2.5" aria-label={resolveLanguageKey("exploreHeading")}>
                        <p className={FOOTER_HEADING_CLASS}>{resolveLanguageKey("exploreHeading")}</p>
                        <Link to="/" className={FOOTER_LINK_CLASS}>{resolveLanguageKey("home")}</Link>
                        <Link to="/blog" className={FOOTER_LINK_CLASS}>{resolveLanguageKey("blog")}</Link>
                        {site.scope === "platform" ? <Link to="/business" className={FOOTER_LINK_CLASS}>{resolveLanguageKey("forBusinesses")}</Link> : null}
                        {sections.map((section) => (
                            <Link key={section.section} to={sectionHref(section)} className={FOOTER_LINK_CLASS}>
                                <PortalSectionName section={section.section} />
                            </Link>
                        ))}
                    </nav>
                    {/* The city landing pages (D181), one column per section. */}
                    {landings.map(({section, links}) => (
                        <nav key={section.section} className="flex flex-col gap-2.5" aria-labelledby={`footer-landings-${section.section}`}>
                            <p id={`footer-landings-${section.section}`} className={FOOTER_HEADING_CLASS}><PortalSectionName section={section.section} /></p>
                            {links.map(({href, label}) => <Link key={href} to={href} className={FOOTER_LINK_CLASS}>{label}</Link>)}
                        </nav>
                    ))}
                </div>
            </div>
            <div className="border-t">
                <div className="site-container flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} {company.name}</p>
                    {/* Every company site invites its visitors to make their own (D178): the sign-up records whose site it was. */}
                    {site.scope === "company" ? (
                        <a href={`${portalApexOrigin()}/business?ref=${encodeURIComponent(company.slug)}`} className="transition-colors hover:text-foreground hover:underline">
                            {resolveLanguageKey("poweredBy").replace("{brand}", site.platform.name)}
                        </a>
                    ) : null}
                    {/* Moved from the header (2026-11-23): a preference set once, not on every visit. */}
                    <ThemeSwitch />
                </div>
            </div>
        </footer>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/portal/shared/footer/index.tsx")
)(PortalFooter);
