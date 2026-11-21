import {useRef} from "react";
import {NavLink, Outlet, useLocation} from "react-router-dom";
import {cn} from "@coreModule/components/lib/utils.ts";
import {SlidingIndicator} from "@coreModule/components/ui/sliding-indicator.tsx";
import {useFadeInOnChange} from "@coreModule/helpers/hooks/useFadeInOnChange.ts";
import {isAccountTabSwitch} from "../shared/accountArea.ts";

export type AccountNavItem = {to: string; end: boolean; label: string};

/** Anything but a tab switch (an order opened from the list) is a new page, which the portal layout fades whole. */
const notATabSwitch = (previous: string, next: string) => !isAccountTabSwitch(previous, next);

/**
 * An account area: its pages beside a list of them (a row of tabs on small screens). Its pages load under the portal
 * layout's one boundary, so switching tabs keeps the current tab on screen until the next one is ready, then fades
 * the new tab up beside the list while the list's highlight slides to it. The rows and sections of its pages come
 * up in turn (`data-account-content`, portal stylesheet).
 */
export default function AccountShell({navLabel, items}: {navLabel: string; items: readonly AccountNavItem[]}) {
    const {pathname} = useLocation();
    const content = useRef<HTMLDivElement>(null);
    useFadeInOnChange(content, pathname, {rise: true, skip: notATabSwitch});
    return (
        <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-14">
            <nav
                aria-label={navLabel}
                className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:sticky lg:top-28 lg:self-start lg:[overflow-anchor:none]"
            >
                {/* The current tab's highlight slides to the next one (NavLink marks it `aria-current`). */}
                <div className="relative">
                    <SlidingIndicator activeKey={pathname} activeSelector="[aria-current='page']" className="rounded-full bg-foreground lg:rounded-xl" />
                    <ul className="flex gap-2 lg:flex-col lg:gap-1">
                        {items.map((item) => (
                            <li key={item.to} className="shrink-0">
                                <NavLink
                                    to={item.to}
                                    end={item.end}
                                    onMouseDown={(event) => event.preventDefault()}
                                    className={({isActive}) => cn(
                                        "relative flex h-10 items-center rounded-full px-4 text-[15px] font-medium transition-colors lg:rounded-xl",
                                        isActive ? "text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    )}
                                >
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>
            <div ref={content} data-account-content className="min-w-0">
                <Outlet />
            </div>
        </div>
    );
}
