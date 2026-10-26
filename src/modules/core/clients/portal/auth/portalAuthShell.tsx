import type {ReactNode} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {PORTAL_CARD, PORTAL_HEADING} from "../shared/portalStyles.ts";

/** Centred card the portal's account pages share. */
export default function PortalAuthShell({title, subtitle, children}: {title: ReactNode; subtitle?: ReactNode; children: ReactNode}) {
    return (
        <div className="flex justify-center px-4 py-12 sm:py-20">
            <div className={cn(PORTAL_CARD, "flex w-full max-w-md flex-col gap-6 p-6 sm:p-8")}>
                <div>
                    <h1 className={cn(PORTAL_HEADING, "text-2xl")}>{title}</h1>
                    {subtitle ? <p className="mt-2 text-portal-ink-muted">{subtitle}</p> : null}
                </div>
                {children}
            </div>
        </div>
    );
}
