import {Suspense} from "react";
import {NavLink, Outlet} from "react-router-dom";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

export type AccountNavItem = {to: string; end: boolean; label: string};

/** An account area: its pages beside a list of them (a row of tabs on small screens). */
export default function AccountShell({navLabel, items}: {navLabel: string; items: readonly AccountNavItem[]}) {
    return (
        <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-14">
            <nav
                aria-label={navLabel}
                className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:sticky lg:top-28 lg:self-start lg:[overflow-anchor:none]"
            >
                <ul className="flex gap-2 lg:flex-col lg:gap-1">
                    {items.map((item) => (
                        <li key={item.to} className="shrink-0">
                            <NavLink
                                to={item.to}
                                end={item.end}
                                onMouseDown={(event) => event.preventDefault()}
                                className={({isActive}) => cn(
                                    "flex h-10 items-center rounded-full px-4 text-[15px] font-medium transition-colors lg:rounded-xl",
                                    isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                )}
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="min-w-0">
                <Suspense fallback={<Loader />}>
                    <Outlet />
                </Suspense>
            </div>
        </div>
    );
}
