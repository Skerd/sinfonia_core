import {IconStar} from "@tabler/icons-react";
import {cn} from "@coreModule/components/lib/utils.ts";

/** A 1–5 rating as five stars, the first `value` filled. Decorative: the number is always shown next to it. */
export function StarRow({value, className}: {value: number; className?: string}) {
    return (
        <span className={cn("inline-flex items-center gap-0.5", className)} aria-hidden>
            {[1, 2, 3, 4, 5].map(n => (
                <IconStar key={n} className={cn("h-4 w-4", n <= value ? "fill-foreground text-foreground" : "text-foreground/25")} />
            ))}
        </span>
    );
}
