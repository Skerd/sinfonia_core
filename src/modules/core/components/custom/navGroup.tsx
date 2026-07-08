import { type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Link, useParams, useLocation} from 'react-router-dom';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@coreModule/components/ui/collapsible.tsx'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@coreModule/components/ui/dropdown-menu.tsx';
import {SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar} from '@coreModule/components/ui/sidebar.tsx';
import {NavCollapsible, NavItem, NavLink, NavLinkItem, NavSubCollapsible} from "@coreModule/helpers/panel/sidebarNav.types.ts";
import {compose} from "redux";

export function ProtectNavigation(
    clearanceLevel: number,
    permissions: string[] = [],
    otherPermissions: string[] = [],
    atLeastOnePermission: boolean = false,
    protectWhat: any
) {
    return compose(
        // withClearance(clearanceLevel, permissions, otherPermissions, atLeastOnePermission),
        // withPiramida(true)
    )(protectWhat)
}

function hrefMatchesSubLink(href: string, url: string | undefined): boolean {
    return !!url && (href === url || href.startsWith(url + '/'));
}

function subEntryActive(href: string, sub: NavLinkItem | NavSubCollapsible): boolean {
    if ('url' in sub && sub.url) {
        return hrefMatchesSubLink(href, String(sub.url));
    }
    return sub.items.some((link) => hrefMatchesSubLink(href, String(link.url)));
}

export function NavGroup({ title, items }: any) {

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
                                item.clearanceLevel,
                                item.permissions,
                                item.otherPermissions,
                                item.atLeastOnePermission,
                                SidebarMenuLink
                            )
                            return <ProtectedMenuLink key={key} item={item} />
                        }
                        if (state === 'collapsed' && !isMobile){
                            const ProtectedSidebarMenuCollapsedDropdown = ProtectNavigation(
                                item.clearanceLevel,
                                item.permissions,
                                item.otherPermissions,
                                item.atLeastOnePermission,
                                SidebarMenuCollapsedDropdown
                            )
                            return (
                                <ProtectedSidebarMenuCollapsedDropdown key={key} item={item}/>
                            )
                        }
                        const ProtectedSidebarMenuCollapsible = ProtectNavigation(
                            item.clearanceLevel,
                            item.permissions,
                            item.otherPermissions,
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

function SidebarMenuLink({ item }: { item: NavLink }) {
    const { setOpenMobile } = useSidebar()
    const { menu, subview } = useParams();

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={checkIsActive(`/${menu}/${subview}`, item)} tooltip={item.title}>
                <Link to={item.url} onClick={() => setOpenMobile(false)}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
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
                        <span>{item.title}</span>
                        <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
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
                                    sub.clearanceLevel,
                                    sub.permissions,
                                    sub.usersPermissions,
                                    true,
                                    () => <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
                                        <Link
                                            to={sub.url}
                                            className={`${checkIsActive(href, sub as NavLink) ? 'bg-secondary' : ''}`}
                                        >
                                            {sub.icon && <sub.icon />}
                                            <span className='max-w-52 text-wrap'>{sub.title}</span>
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
                            const nestedItems = nested.items.map((link) => {
                                const ProtectedNestedItem = ProtectNavigation(
                                    link.clearanceLevel,
                                    link.permissions,
                                    link.usersPermissions,
                                    true,
                                    () => <DropdownMenuItem key={`${nested.title}-${link.title}-${link.url}`} asChild>
                                        <Link
                                            to={link.url}
                                            className={`${hrefMatchesSubLink(href, String(link.url)) ? 'bg-secondary' : ''}`}
                                        >
                                            {link.icon && <link.icon />}
                                            <span className='max-w-52 text-wrap'>{link.title}</span>
                                            {link.badge && (
                                                <span className='ms-auto text-xs'>{link.badge}</span>
                                            )}
                                        </Link>
                                    </DropdownMenuItem>
                                );
                                return <ProtectedNestedItem key={`${link.title}-${link.url}`} />;
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
    const isChildActive = item.items?.some((sub) => subEntryActive(href, sub));
    return (
        <Collapsible asChild defaultOpen={isChildActive || checkIsActive(href, item, true)} className='group/collapsible'>
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180' />
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
                                        subItem.clearanceLevel,
                                        subItem.permissions,
                                        subItem.usersPermissions,
                                        true,
                                        () => <SidebarMenuSubItem key={subItem.title}>
                                            <SidebarMenuSubButton asChild isActive={checkIsActive(href, subItem as NavLink)}>
                                                <Link to={subItem.url} onClick={() => setOpenMobile(false)}>
                                                    {subItem.icon && <subItem.icon />}
                                                    <span>{subItem.title}</span>
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
                                const nestedOpen = nested.items.some((link) => hrefMatchesSubLink(href, String(link.url)));
                                return (
                                    <Collapsible
                                        key={nested.title}
                                        defaultOpen={nestedOpen}
                                        className='group/subcollapsible'
                                    >
                                        <SidebarMenuSubItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuSubButton isActive={nestedOpen}>
                                                    {nested.icon && <nested.icon />}
                                                    <span>{nested.title}</span>
                                                    <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/subcollapsible:rotate-90 rtl:rotate-180' />
                                                </SidebarMenuSubButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub>
                                                    {nested.items.map((link) => {
                                                        const ProtectedNestedLink = ProtectNavigation(
                                                            link.clearanceLevel,
                                                            link.permissions,
                                                            link.usersPermissions,
                                                            true,
                                                            () => (
                                                                <SidebarMenuSubItem key={`${nested.title}-${link.title}`}>
                                                                    <SidebarMenuSubButton asChild isActive={hrefMatchesSubLink(href, String(link.url))}>
                                                                        <Link to={link.url} onClick={() => setOpenMobile(false)}>
                                                                            {link.icon && <link.icon />}
                                                                            <span>{link.title}</span>
                                                                            {link.badge && <NavBadge>{link.badge}</NavBadge>}
                                                                        </Link>
                                                                    </SidebarMenuSubButton>
                                                                </SidebarMenuSubItem>
                                                            )
                                                        );
                                                        return (
                                                            <ProtectedNestedLink key={`${nested.title}-${link.title}-${link.url}`} />
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
      !!item?.items?.some((i) =>
          'url' in i && i.url
              ? href === i.url || href.split('?')[0] === i.url
              : (i as NavSubCollapsible).items?.some((link) => href === link.url || href.split('?')[0] === link.url)
      );

  return (
    href === item.url || // /endpint?search=param
    href.split('?')[0] === item.url || // endpoint
    childMatches ||
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === item?.url?.split('/')[1])
  )
}
