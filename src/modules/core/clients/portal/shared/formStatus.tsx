import type {ReactNode} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";

/** A line of feedback under a form: neutral, an error (announced) or a success. */
export default function FormStatus({children, tone = "default"}: {children: ReactNode; tone?: "default" | "error" | "success"}) {
    return (
        <p
            role={tone === "error" ? "alert" : "status"}
            className={cn(
                "text-sm leading-relaxed",
                tone === "error" ? "text-destructive" : tone === "success" ? "text-success" : "text-muted-foreground",
            )}
        >
            {children}
        </p>
    );
}
