/**
 * The account area a tab of it belongs to (`/account`, `/shop/account`, `/tasks/account`): the area itself or one page
 * under it (`/shop/account/orders`). A deeper page (an order) is not a tab: `null`, as outside an account area.
 */
function accountAreaOfTab(pathname: string): string | null {
    const match = /^(.*?\/account)(?:\/[^/]+)?\/?$/.exec(pathname);
    return match ? match[1] : null;
}

/** Moving between the tabs of one account area: its shell and list stay, only the tab beside the list changes. */
export function isAccountTabSwitch(previous: string, next: string): boolean {
    const area = accountAreaOfTab(previous);
    return area !== null && area === accountAreaOfTab(next);
}
