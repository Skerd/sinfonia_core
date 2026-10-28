import {useEffect, useState} from "react";
import {Link, useParams} from "react-router-dom";
import {compose} from "redux";
import {toast} from "sonner";
import {ArrowLeft, ChevronRight, Link2, Store} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Skeleton} from "@coreModule/components/ui/skeleton.tsx";
import type {
    PublicBlogFormResponseType,
    PublicBlogPostItem,
    PublicBlogSeller,
} from "armonia/src/modules/core/api/auxiliary/public/blog/blog.form.response.type.ts";
import {companySiteOrigin} from "../shared/portalZone.ts";
import type {PublicBlogSingleFormResponseType} from "armonia/src/modules/core/api/auxiliary/public/blog/blogSingle.form.response.type.ts";
import {usePortalSite} from "../shared/portalSiteContext.tsx";
import BlogCard, {blogMetaLine} from "./blogCard.tsx";
import {useBlogCompanyQuery, withCompany} from "./blogCompany.ts";

const MORE_STORIES = 3;

/** Post content is plain text: blank lines separate paragraphs, single newlines stay line breaks. */
function paragraphs(content: string): string[] {
    return content.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
}

function sellerLogoUrl(logo: string | undefined): string | undefined {
    if (!logo) return undefined;
    if (logo.startsWith("http://") || logo.startsWith("https://") || logo.startsWith("/")) return logo;
    return `/api/auxiliary/public/media/${logo}`;
}

/** The company's own site, when this page is not already on it. */
function companyHref(seller: PublicBlogSeller): string | undefined {
    const slug = seller.siteSlug?.trim();
    const origin = slug ? companySiteOrigin(slug) : null;
    if (origin && origin !== window.location.origin) return origin;
    const host = seller.siteHost?.trim();
    if (!origin && host) {
        const {protocol, port} = window.location;
        const href = `${protocol}//${host}${port ? `:${port}` : ""}`;
        if (href !== window.location.origin) return href;
    }
    return undefined;
}

function initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

/** Who published the story, and on the apex a link to that company's site. Same card products use. */
function BlogCompanyCard({seller, resolveLanguageKey}: {seller: PublicBlogSeller; resolveLanguageKey: WithLanguageType["resolveLanguageKey"]}) {
    const href = companyHref(seller);
    const logo = sellerLogoUrl(seller.logo);
    const visitLabel = resolveLanguageKey("visitSiteNamed").replace("{name}", seller.name);
    const mark = logo ? (
        <span className="inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card ring-1 ring-border">
            <img src={logo} alt="" className="size-full object-contain p-0.5" />
        </span>
    ) : (
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground font-display text-sm font-semibold text-background" aria-hidden>
            {initials(seller.name) || "·"}
        </span>
    );
    const identity = (
        <>
            {mark}
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{resolveLanguageKey("publishedBy")}</p>
                <p className={`truncate font-display text-base font-semibold tracking-tight ${href ? "underline-offset-2 group-hover/company:underline" : ""}`}>
                    {seller.name}
                </p>
            </div>
        </>
    );

    return (
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-border bg-muted/60 px-4 py-3">
            {href ? (
                <a href={href} aria-label={visitLabel} className="group/company flex min-w-0 flex-1 items-center gap-3">
                    {identity}
                </a>
            ) : (
                <div className="flex min-w-0 flex-1 items-center gap-3">{identity}</div>
            )}
            {href ? (
                <a href={href} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-foreground">
                    <Store className="size-3.5" aria-hidden />
                    {resolveLanguageKey("visitSite")}
                </a>
            ) : null}
        </div>
    );
}

function BlogArticlePage({resolveLanguageKey}: WithLanguageType) {
    const companySlug = useBlogCompanyQuery();
    const {site} = usePortalSite();
    const {slug = ""} = useParams();
    const [post, setPost] = useState<PublicBlogPostItem | null>(null);
    const [more, setMore] = useState<PublicBlogPostItem[]>([]);
    const [loading, setLoading] = useState(true);
    const showCompany = !companySlug && site?.scope !== "company";
    const listHref = withCompany("/blog", companySlug);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setPost(null);
        setMore([]);
        (async () => {
            try {
                const res = await apiClient.post<PublicBlogSingleFormResponseType>("/api/auxiliary/public/blog/single", {slug});
                if (cancelled) return;
                const current = res.data.post;
                setPost(current);
                const related = await apiClient.post<PublicBlogFormResponseType>("/api/auxiliary/public/blog", {
                    categorySlug: current.category?.slug,
                    limit: MORE_STORIES + 1,
                });
                if (!cancelled) setMore((related.data.posts ?? []).filter((item) => item._id !== current._id).slice(0, MORE_STORIES));
            } catch {
                if (!cancelled) setPost(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [slug, companySlug]);

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success(resolveLanguageKey("linkCopied"));
        } catch {
            toast.error(resolveLanguageKey("linkCopyFailed"));
        }
    }

    if (loading) {
        return (
            <div className="site-container py-8 sm:py-12">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-5" aria-busy="true" aria-label={resolveLanguageKey("loading")}>
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="mt-6 aspect-[16/9] rounded-3xl" />
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="site-container flex flex-col items-center gap-4 py-20 text-center">
                <h1 className="font-display text-3xl font-semibold">{resolveLanguageKey("notFound")}</h1>
                <p className="text-muted-foreground">{resolveLanguageKey("notFoundMessage")}</p>
                <Button asChild variant="link" className="h-auto p-0"><Link to={listHref}>{resolveLanguageKey("backToBlog")}</Link></Button>
            </div>
        );
    }

    const gallery = post.imageGallery ?? [];
    const relatedCompany = (item: PublicBlogPostItem) => companySlug || (showCompany ? item.seller?.siteSlug : undefined);

    return (
        <div className="site-container flex flex-col gap-16 py-8 sm:gap-20 sm:py-12">
            <article className="flex flex-col gap-10">
                <header className="mx-auto flex w-full max-w-3xl flex-col gap-5">
                    <nav aria-label={resolveLanguageKey("breadcrumb")} className="text-sm text-muted-foreground">
                        <ol className="flex flex-wrap items-center gap-1.5">
                            <li><Link to={listHref} className="hover:text-foreground">{resolveLanguageKey("blog")}</Link></li>
                            {post.category ? (
                                <>
                                    <li aria-hidden><ChevronRight className="size-3.5" /></li>
                                    <li>
                                        <Link to={withCompany(`/blog?category=${encodeURIComponent(post.category.slug)}`, companySlug)} className="hover:text-foreground">
                                            {post.category.name}
                                        </Link>
                                    </li>
                                </>
                            ) : null}
                        </ol>
                    </nav>
                    <h1 className="font-display text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl lg:text-6xl">{post.title}</h1>
                    {post.excerpt ? <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">{post.excerpt}</p> : null}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-y py-4">
                        <div className="flex min-w-0 flex-col gap-1 text-sm">
                            {post.authorName ? <span className="font-semibold">{post.authorName}</span> : null}
                            <span className="text-muted-foreground">{blogMetaLine(resolveLanguageKey, post)}</span>
                        </div>
                        <Button type="button" variant="outline" size="lg" onClick={copyLink}>
                            <Link2 aria-hidden />
                            {resolveLanguageKey("copyLink")}
                        </Button>
                    </div>
                </header>

                {post.mainImage ? <img src={post.mainImage} alt="" className="aspect-[16/9] w-full rounded-3xl bg-muted object-cover" /> : null}

                <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 text-[17px] leading-[1.75]">
                    {paragraphs(post.content).map((block, index) => (
                        <p key={index} className="whitespace-pre-line">{block}</p>
                    ))}
                </div>

                {gallery.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {gallery.map((url) => (
                            <img key={url} src={url} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl bg-muted object-cover" />
                        ))}
                    </div>
                ) : null}

                <div className="mx-auto w-full max-w-2xl">
                    <Link to={listHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-4" aria-hidden />
                        {resolveLanguageKey("backToBlog")}
                    </Link>
                </div>
            </article>

            {more.length > 0 ? (
                <section className="flex flex-col gap-6 border-t pt-12" aria-labelledby="portal-blog-more">
                    <h2 id="portal-blog-more" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{resolveLanguageKey("moreStories")}</h2>
                    <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                        {more.map((item) => (
                            <BlogCard key={item._id} post={item} companySlug={relatedCompany(item)} showCompany={showCompany} />
                        ))}
                    </div>
                </section>
            ) : null}
            {post.seller ? <BlogCompanyCard seller={post.seller} resolveLanguageKey={resolveLanguageKey} /> : null}
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/blog/article.tsx"))(BlogArticlePage);
