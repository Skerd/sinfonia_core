import {useEffect, useState} from "react";
import {compose} from "redux";
import {useSearchParams} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Skeleton} from "@coreModule/components/ui/skeleton.tsx";
import type {
    PublicBlogCategoryItem,
    PublicBlogFormResponseType,
    PublicBlogPostItem,
} from "armonia/src/modules/core/api/auxiliary/public/blog/blog.form.response.type.ts";
import {usePortalSite} from "../shared/portalSiteContext.tsx";
import BlogCard from "./blogCard.tsx";
import {useBlogCompanyQuery} from "./blogCompany.ts";

const LANGUAGE_PATH = "src/modules/core/clients/portal/blog/index.tsx";
const PAGE_SIZE = 12;

type BlogBrowserProps = WithLanguageType & {
    /** `page` is `/blog`. `section` is the block on the home and on a company's pages. */
    mode: "page" | "section";
    /** Set when every post belongs to one company (a company host needs none; the host is the company). */
    companySlug?: string;
    /** Wrap in the site column. The home already has one; a company page does not. */
    contained?: boolean;
};

function BlogBrowser({resolveLanguageKey, mode, companySlug, contained = false}: BlogBrowserProps) {
    const {site} = usePortalSite();
    const [searchParams, setSearchParams] = useSearchParams();
    const [localCategory, setLocalCategory] = useState("");
    const categorySlug = mode === "page" ? (searchParams.get("category") ?? "") : localCategory;

    const [posts, setPosts] = useState<PublicBlogPostItem[]>([]);
    const [categories, setCategories] = useState<PublicBlogCategoryItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setPage(1);
        (async () => {
            try {
                const res = await apiClient.post<PublicBlogFormResponseType>("/api/auxiliary/public/blog", {
                    categorySlug: categorySlug || undefined,
                    limit: PAGE_SIZE,
                });
                if (cancelled) return;
                setPosts(res.data.posts ?? []);
                setTotal(res.data.total ?? 0);
                setCategories(res.data.categories ?? []);
            } catch {
                if (!cancelled) {
                    setPosts([]);
                    setTotal(0);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [categorySlug, companySlug]);

    async function loadMore() {
        const next = page + 1;
        setLoadingMore(true);
        try {
            const res = await apiClient.post<PublicBlogFormResponseType>("/api/auxiliary/public/blog", {
                categorySlug: categorySlug || undefined,
                limit: PAGE_SIZE,
                page: next,
            });
            setPosts((current) => [...current, ...(res.data.posts ?? [])]);
            setPage(next);
        } catch {
            // The button stays for another try.
        } finally {
            setLoadingMore(false);
        }
    }

    function selectCategory(slug: string) {
        if (mode === "section") {
            setLocalCategory(slug);
            return;
        }
        setSearchParams((current) => {
            const next = new URLSearchParams(current);
            if (slug) next.set("category", slug); else next.delete("category");
            return next;
        });
    }

    if (mode === "section" && !loading && posts.length === 0) return null;

    const showCompany = !companySlug && site?.scope !== "company";
    const Heading = mode === "page" ? "h1" : "h2";
    const linkCompany = (post: PublicBlogPostItem) => companySlug || (showCompany ? post.seller?.siteSlug : undefined);

    const body = (
        <section className="flex flex-col gap-8" aria-labelledby="portal-blog-heading">
            <header className="flex flex-col gap-3">
                <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">{resolveLanguageKey("eyebrow")}</p>
                <Heading id="portal-blog-heading" className={mode === "page"
                    ? "max-w-3xl font-display text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl"
                    : "font-display text-2xl font-bold tracking-tight sm:text-3xl"}>
                    {resolveLanguageKey("title")}
                </Heading>
                <p className="max-w-2xl leading-relaxed text-muted-foreground">
                    {resolveLanguageKey(companySlug || site?.scope === "company" ? "leadCompany" : "lead")}
                </p>
            </header>

            {categories.length > 0 ? (
                <nav aria-label={resolveLanguageKey("categoriesLabel")} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                    <ul className="flex gap-2 sm:flex-wrap">
                        <li>
                            <Button type="button" size="lg" variant={categorySlug ? "outline" : "default"} aria-pressed={!categorySlug} onClick={() => selectCategory("")}>
                                {resolveLanguageKey("allStories")}
                            </Button>
                        </li>
                        {categories.map((category) => (
                            <li key={category._id}>
                                <Button
                                    type="button"
                                    size="lg"
                                    variant={category.slug === categorySlug ? "default" : "outline"}
                                    aria-pressed={category.slug === categorySlug}
                                    onClick={() => selectCategory(category.slug)}
                                >
                                    {category.name}
                                </Button>
                            </li>
                        ))}
                    </ul>
                </nav>
            ) : null}

            {loading ? (
                <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label={resolveLanguageKey("loading")}>
                    {Array.from({length: mode === "page" ? 6 : 3}, (_, index) => (
                        <div key={index} className="flex flex-col gap-3">
                            <Skeleton className="aspect-[16/10] rounded-2xl" />
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-3xl bg-muted px-6 py-20 text-center">
                    <p className="font-display text-2xl font-semibold">{resolveLanguageKey("emptyTitle")}</p>
                    <p className="max-w-md text-muted-foreground">{resolveLanguageKey(categorySlug ? "emptyCategory" : "emptyMessage")}</p>
                    {categorySlug ? (
                        <Button type="button" variant="outline" size="lg" onClick={() => selectCategory("")}>{resolveLanguageKey("allStories")}</Button>
                    ) : null}
                </div>
            ) : (
                <div className="flex flex-col gap-10">
                    <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post) => (
                            <BlogCard key={post._id} post={post} companySlug={linkCompany(post)} showCompany={showCompany} />
                        ))}
                    </div>
                    {posts.length < total ? (
                        <div className="flex flex-col items-center gap-2">
                            <Button type="button" variant="outline" size="lg" onClick={loadMore} disabled={loadingMore}>
                                {resolveLanguageKey(loadingMore ? "loadingMore" : "loadMore")}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                {resolveLanguageKey("shownOf").replace("{shown}", String(posts.length)).replace("{total}", String(total))}
                            </p>
                        </div>
                    ) : null}
                </div>
            )}
        </section>
    );

    if (!contained) return body;
    return <div className="site-container py-8 sm:py-12">{body}</div>;
}

function BlogPage(props: WithLanguageType) {
    const companySlug = useBlogCompanyQuery();
    return (
        <div className="site-container py-8 sm:py-12">
            <BlogBrowser {...props} mode="page" companySlug={companySlug} />
        </div>
    );
}

function BlogSectionView(props: WithLanguageType & {companySlug?: string; contained?: boolean}) {
    return <BlogBrowser {...props} mode="section" />;
}

/** The journal on the home (every company on the apex, this company on its host) and on a company's pages. */
export const BlogSection = compose(withLanguage(LANGUAGE_PATH))(BlogSectionView);

export default compose(withLanguage(LANGUAGE_PATH))(BlogPage);
