import type {ReactNode} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";

/** Card the portal's account screens share. */
export default function PortalAuthShell({title, subtitle, children}: {title: ReactNode; subtitle?: ReactNode; children: ReactNode}) {
    return (
        <div className="site-container flex justify-center py-10 sm:py-16">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="font-display text-2xl font-bold tracking-tight">{title}</CardTitle>
                    {subtitle ? <CardDescription className="leading-relaxed">{subtitle}</CardDescription> : null}
                </CardHeader>
                <CardContent className="flex flex-col gap-6">{children}</CardContent>
            </Card>
        </div>
    );
}
