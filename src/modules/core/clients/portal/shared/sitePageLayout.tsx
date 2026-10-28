import {Outlet} from "react-router-dom";

/** Width and spacing of a section's pages inside the portal shell. */
export default function SitePageLayout() {
    return (
        <div className="site-container py-8 sm:py-12">
            <Outlet />
        </div>
    );
}
