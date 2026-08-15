import {type ReactNode, useLayoutEffect, useRef, useState} from 'react';
import { ChevronRight } from 'lucide-react';
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Link, useParams, useLocation} from 'react-router-dom';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@coreModule/components/ui/collapsible.tsx'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@coreModule/components/ui/dropdown-menu.tsx';
import {SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar} from '@coreModule/components/ui/sidebar.tsx';
import {NavCollapsible, NavItem, NavLink, NavLinkItem, NavSubCollapsible} from "@coreModule/helpers/panel/sidebarNav.types.ts";
import {compose} from "redux";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";

/**
 * Currently an identity wrapper: both guard HOCs are disabled below, so the
 * permission arguments are accepted (and underscore-prefixed) purely to keep
 * every call site wired up for when `withClearance` is switched back on.
 */
export function ProtectNavigation(
    _permissions: string[] = [],
    _usersPermissions: string[] = [],
    _atLeastOnePermission: boolean = false,
    protectWhat: any
) {
    return compose(
        // withClearance(permissions, usersPermissions, atLeastOnePermission),
        // withPiramida(true)
    )(protectWhat)
}

function hrefMatchesSubLink(href: string, url: string | undefined): boolean {
    return !!url && (href === url || href.startsWith(url + '/'));
}

function subEntryActive(href: string, sub: NavLinkItem | NavSubCollapsible): boolean {
    // Narrow on `items` rather than `url`: a NavLinkItem with a falsy url would
    // otherwise fall through to the recursive branch, which it has no items for.
    if ('items' in sub && sub.items) {
        return sub.items.some((child) => subEntryActive(href, child));
    }
    return 'url' in sub && !!sub.url && hrefMatchesSubLink(href, String(sub.url));
}

export function NavGroup({ title, items }: {title: string; items: NavItem[]}) {

    const { state, isMobile } = useSidebar()
    // const { menu, subview } = useParams();
    // const href = `/${menu}/${subview}`

    return (
        <SidebarGroup>
            <SidebarGroupLabel>{title}</SidebarGroupLabel>
            <SidebarMenu>
                {
                    items.map((item) => {
                        const key = `${item.title}-${("url" in item ? item.url : "group") ?? 'group'}`
                        if (!item.items){
                            const ProtectedMenuLink = ProtectNavigation(
                                item.permissions,
                                item.usersPermissions,
                                item.atLeastOnePermission,
                                SidebarMenuLink
                            )
                            return <ProtectedMenuLink key={key} item={item} />
                        }
                        if (state === 'collapsed' && !isMobile){
                            const ProtectedSidebarMenuCollapsedDropdown = ProtectNavigation(
                                item.permissions,
                                item.usersPermissions,
                                item.atLeastOnePermission,
                                SidebarMenuCollapsedDropdown
                            )
                            return (
                                <ProtectedSidebarMenuCollapsedDropdown key={key} item={item}/>
                            )
                        }
                        const ProtectedSidebarMenuCollapsible = ProtectNavigation(
                            item.permissions,
                            item.usersPermissions,
                            item.atLeastOnePermission,
                            SidebarMenuCollapsible
                        )
                        return <ProtectedSidebarMenuCollapsible key={key} item={item} />
                    })
                }
            </SidebarMenu>
        </SidebarGroup>
    )
}

function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className='rounded-full px-1 py-0 text-xs'>{children}</Badge>
}

/** Truncated label that shows a tooltip only when the text overflows. */
function NavTruncatedTitle({ title, className }: { title: string; className?: string }) {
    const ref = useRef<HTMLSpanElement>(null)
    const [truncated, setTruncated] = useState(false)

    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        const check = () => setTruncated(el.scrollWidth > el.clientWidth + 1)
        check()
        const ro = new ResizeObserver(check)
        ro.observe(el)
        return () => ro.disconnect()
    }, [title])

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span ref={ref} className={cn('min-w-0 truncate', className)}>
                        {title}
                    </span>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} hidden={!truncated}>
                    {title}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

function SidebarMenuLink({ item }: { item: NavLink }) {
    const { setOpenMobile } = useSidebar()
    const { menu, subview } = useParams();

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={checkIsActive(`/${menu}/${subview}`, item)} tooltip={item.title}>
                <Link to={item.url} onClick={() => setOpenMobile(false)}>
                    {item.icon && <item.icon />}
                    <NavTruncatedTitle title={item.title} />
                </Link>
            </SidebarMenuButton>
            {item.badge && (
                <SidebarMenuBadge className="p-0">
                    <NavBadge>{item.badge}</NavBadge>
                </SidebarMenuBadge>
            )}
        </SidebarMenuItem>
    )
}

function SidebarMenuCollapsedDropdown({item}: { item: NavCollapsible }) {
    const { menu, subview } = useParams();
    const { pathname } = useLocation();
    const href = pathname || `/${menu || ''}/${subview || ''}`;

    return (
        <SidebarMenuItem>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={checkIsActive(href, item)}>
                        {item.icon && <item.icon />}
                        <NavTruncatedTitle title={item.title} className='flex-1' />
                        <ChevronRight className='ms-auto shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side='right' align='start' sideOffset={4}>
                    <DropdownMenuLabel>
                        {item.title} {item.badge ? `(${item.badge})` : ''}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {
                        item.items.filter((x: NavLinkItem | NavSubCollapsible) => !!x).flatMap((sub: NavLinkItem | NavSubCollapsible) => {
                            if ('url' in sub && sub.url) {
                                const ProtectedDropDownItem = ProtectNavigation(
                                    sub.permissions,
                                    sub.usersPermissions,
                                    true,
                                    () => <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
                                        <Link
                                            to={sub.url}
                                            className={`${checkIsActive(href, sub as NavLink) ? 'bg-secondary' : ''}`}
                                        >
                                            {sub.icon && <sub.icon />}
                                            <NavTruncatedTitle title={sub.title} className='max-w-52' />
                                            {sub.badge && (
                                                <span className='ms-auto text-xs'>{sub.badge}</span>
                                            )}
                                        </Link>
                                    </DropdownMenuItem>
                                );
                                return [<ProtectedDropDownItem key={`${sub.title}-${sub.url}`} />];
                            }
                            const nested = sub as NavSubCollapsible;
                            const label = (
                                <DropdownMenuLabel key={`sub-${nested.title}`}>
                                    {nested.title}
                                </DropdownMenuLabel>
                            );
                            const nestedItems = nested.items.flatMap((child) => {
                                if ('url' in child && child.url) {
                                    const ProtectedNestedItem = ProtectNavigation(
                                        child.permissions,
                                        child.usersPermissions,
                                        true,
                                        () => <DropdownMenuItem key={`${nested.title}-${child.title}-${child.url}`} asChild>
                                            <Link
                                                to={child.url}
                                                className={`${hrefMatchesSubLink(href, String(child.url)) ? 'bg-secondary' : ''}`}
                                            >
                                                {child.icon && <child.icon />}
                                                <NavTruncatedTitle title={child.title} className='max-w-52' />
                                                {child.badge && (
                                                    <span className='ms-auto text-xs'>{child.badge}</span>
                                                )}
                                            </Link>
                                        </DropdownMenuItem>
                                    );
                                    return [<ProtectedNestedItem key={`${child.title}-${child.url}`} />];
                                }
                                const deeper = child as NavSubCollapsible;
                                const deeperLabel = (
                                    <DropdownMenuLabel key={`sub-${nested.title}-${deeper.title}`}>
                                        {deeper.title}
                                    </DropdownMenuLabel>
                                );
                                const deeperItems = deeper.items.map((link) => {
                                    if (!('url' in link) || !link.url) return null;
                                    const ProtectedDeeperItem = ProtectNavigation(
                                        link.permissions,
                                        link.usersPermissions,
                                        true,
                                        () => <DropdownMenuItem key={`${deeper.title}-${link.title}-${link.url}`} asChild>
                                            <Link
                                                to={link.url}
                                                className={`${hrefMatchesSubLink(href, String(link.url)) ? 'bg-secondary' : ''}`}
                                            >
                                                {link.icon && <link.icon />}
                                                <NavTruncatedTitle title={link.title} className='max-w-52' />
                                                {link.badge && (
                                                    <span className='ms-auto text-xs'>{link.badge}</span>
                                                )}
                                            </Link>
                                        </DropdownMenuItem>
                                    );
                                    return <ProtectedDeeperItem key={`${link.title}-${link.url}`} />;
                                }).filter(Boolean);
                                return [deeperLabel, ...deeperItems];
                            });
                            return [label, ...nestedItems];
                        })
                    }
                </DropdownMenuContent>
            </DropdownMenu>
            {item.badge && (
                <SidebarMenuBadge className="p-0">
                    <NavBadge>{item.badge}</NavBadge>
                </SidebarMenuBadge>
            )}
        </SidebarMenuItem>
    )
}



function SidebarMenuCollapsible({item}: { item: NavCollapsible}) {
    const { setOpenMobile } = useSidebar();
    const { pathname } = useLocation();
    const href = pathname || '';
    return (
        <Collapsible asChild defaultOpen className='group/collapsible'>
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <NavTruncatedTitle title={item.title} className='flex-1' />
                        <ChevronRight className='ms-auto shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180' />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                {item.badge && (
                    <SidebarMenuBadge className="p-0">
                        <NavBadge>{item.badge}</NavBadge>
                    </SidebarMenuBadge>
                )}
                <CollapsibleContent className='CollapsibleContent'>
                    <SidebarMenuSub>
                        {
                            item.items.map((subItem) => {
                                if ('url' in subItem && subItem.url) {
                                    const ProtectedSidebarMenuSubItem = ProtectNavigation(
                                        subItem.permissions,
                                        subItem.usersPermissions,
                                        true,
                                        () => <SidebarMenuSubItem key={subItem.title}>
                                            <SidebarMenuSubButton asChild isActive={checkIsActive(href, subItem as NavLink)}>
                                                <Link to={subItem.url} onClick={() => setOpenMobile(false)}>
                                                    {subItem.icon && <subItem.icon />}
                                                    <NavTruncatedTitle title={subItem.title} />
                                                    {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    );
                                    return (
                                        <ProtectedSidebarMenuSubItem key={`${subItem.title}-${subItem.url}`} />
                                    );
                                }
                                const nested = subItem as NavSubCollapsible;
                                const nestedOpen = nested.items.some((child) => subEntryActive(href, child));
                                return (
                                    <Collapsible
                                        key={nested.title}
                                        defaultOpen
                                        className='group/subcollapsible'
                                    >
                                        <SidebarMenuSubItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuSubButton isActive={nestedOpen}>
                                                    {nested.icon && <nested.icon />}
                                                    <NavTruncatedTitle title={nested.title} className='flex-1' />
                                                    <ChevronRight className='ms-auto shrink-0 transition-transform duration-200 group-data-[state=open]/subcollapsible:rotate-90 rtl:rotate-180' />
                                                </SidebarMenuSubButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub>
                                                    {nested.items.map((child) => {
                                                        if ('url' in child && child.url) {
                                                            const ProtectedNestedLink = ProtectNavigation(
                                                                child.permissions,
                                                                child.usersPermissions,
                                                                true,
                                                                () => (
                                                                    <SidebarMenuSubItem key={`${nested.title}-${child.title}`}>
                                                                        <SidebarMenuSubButton asChild isActive={hrefMatchesSubLink(href, String(child.url))}>
                                                                            <Link to={child.url} onClick={() => setOpenMobile(false)}>
                                                                                {child.icon && <child.icon />}
                                                                                <NavTruncatedTitle title={child.title} />
                                                                                {child.badge && <NavBadge>{child.badge}</NavBadge>}
                                                                            </Link>
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuSubItem>
                                                                )
                                                            );
                                                            return (
                                                                <ProtectedNestedLink key={`${nested.title}-${child.title}-${child.url}`} />
                                                            );
                                                        }
                                                        const deeper = child as NavSubCollapsible;
                                                        const deeperOpen = deeper.items.some((link) => subEntryActive(href, link));
                                                        return (
                                                            <Collapsible
                                                                key={`${nested.title}-${deeper.title}`}
                                                                defaultOpen
                                                                className='group/subcollapsible2'
                                                            >
                                                                <SidebarMenuSubItem>
                                                                    <CollapsibleTrigger asChild>
                                                                        <SidebarMenuSubButton isActive={deeperOpen}>
                                                                            {deeper.icon && <deeper.icon />}
                                                                            <NavTruncatedTitle title={deeper.title} className='flex-1' />
                                                                            <ChevronRight className='ms-auto shrink-0 transition-transform duration-200 group-data-[state=open]/subcollapsible2:rotate-90 rtl:rotate-180' />
                                                                        </SidebarMenuSubButton>
                                                                    </CollapsibleTrigger>
                                                                    <CollapsibleContent>
                                                                        <SidebarMenuSub>
                                                                            {deeper.items.map((link) => {
                                                                                if (!('url' in link) || !link.url) return null;
                                                                                const ProtectedDeeperLink = ProtectNavigation(
                                                                                    link.permissions,
                                                                                    link.usersPermissions,
                                                                                    true,
                                                                                    () => (
                                                                                        <SidebarMenuSubItem key={`${deeper.title}-${link.title}`}>
                                                                                            <SidebarMenuSubButton asChild isActive={hrefMatchesSubLink(href, String(link.url))}>
                                                                                                <Link to={link.url} onClick={() => setOpenMobile(false)}>
                                                                                                    {link.icon && <link.icon />}
                                                                                                    <NavTruncatedTitle title={link.title} />
                                                                                                    {link.badge && <NavBadge>{link.badge}</NavBadge>}
                                                                                                </Link>
                                                                                            </SidebarMenuSubButton>
                                                                                        </SidebarMenuSubItem>
                                                                                    )
                                                                                );
                                                                                return (
                                                                                    <ProtectedDeeperLink key={`${deeper.title}-${link.title}-${link.url}`} />
                                                                                );
                                                                            })}
                                                                        </SidebarMenuSub>
                                                                    </CollapsibleContent>
                                                                </SidebarMenuSubItem>
                                                            </Collapsible>
                                                        );
                                                    })}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuSubItem>
                                    </Collapsible>
                                );
                            })
                        }
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    )
}


function checkIsActive(href: string, item: NavItem, mainNav = false) {

  const childMatches =
      !!item?.items?.some((i) => subEntryActive(href, i as NavLinkItem | NavSubCollapsible));

  // `To` also covers Partial<Path>; only string urls are path-comparable.
  const itemUrl = typeof item?.url === 'string' ? item.url : undefined;

  return (
    href === itemUrl || // /endpint?search=param
    href.split('?')[0] === itemUrl || // endpoint
    childMatches ||
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === itemUrl?.split('/')[1])
  )
}
