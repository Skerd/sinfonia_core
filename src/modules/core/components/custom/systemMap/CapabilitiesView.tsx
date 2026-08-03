import type {ModuleCapabilities} from "./systemMap.types.ts";

const MODULE_COLORS: Record<string, string> = {
    eCommerce: "var(--chart-4)",
    eCommerceMarketplace: "var(--chart-3)",
    propertyManagement: "var(--chart-5)",
    shared: "var(--muted-foreground)",
};

type CapabilitiesViewProps = {
    capabilities: ModuleCapabilities[];
};

export function CapabilitiesView({capabilities}: CapabilitiesViewProps) {
    const cols =
        capabilities.length >= 3 ? "lg:grid-cols-3" : capabilities.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-1";

    return (
        <div className={`grid gap-4 ${cols}`}>
            {capabilities.map((mod) => {
                const accent = MODULE_COLORS[mod.id] ?? "var(--muted-foreground)";
                return (
                    <article
                        key={mod.id}
                        className="flex flex-col gap-4 rounded-md border bg-background p-5"
                        style={{borderTopWidth: 3, borderTopColor: accent}}
                    >
                        <header>
                            <h3 className="text-lg font-semibold" style={{color: accent}}>
                                {mod.title}
                            </h3>
                            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                                {mod.summary}
                            </p>
                        </header>

                        <section>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                What it offers
                            </h4>
                            <ul className="flex flex-col gap-2.5">
                                {mod.offers.map((offer) => (
                                    <li key={offer.title}>
                                        <div className="text-sm font-medium">{offer.title}</div>
                                        <div className="text-[12px] text-muted-foreground leading-snug">
                                            {offer.description}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                Key APIs
                            </h4>
                            <ul className="flex flex-col gap-1">
                                {mod.apis.map((api) => (
                                    <li
                                        key={api}
                                        className="font-mono text-[11px] text-foreground break-all"
                                    >
                                        {api}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {mod.crons && mod.crons.length > 0 && (
                            <section>
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                    Cron jobs
                                </h4>
                                <ul className="flex flex-wrap gap-1.5">
                                    {mod.crons.map((cron) => (
                                        <li
                                            key={cron}
                                            className="rounded border bg-muted/40 px-2 py-0.5 text-[11px]"
                                        >
                                            {cron}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {mod.publicRoutes && mod.publicRoutes.length > 0 && (
                            <section>
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                    Public shop routes
                                </h4>
                                <ul className="flex flex-wrap gap-1.5">
                                    {mod.publicRoutes.map((route) => (
                                        <li
                                            key={route}
                                            className="rounded border bg-muted/40 px-2 py-0.5 font-mono text-[11px]"
                                        >
                                            {route}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </article>
                );
            })}
        </div>
    );
}
