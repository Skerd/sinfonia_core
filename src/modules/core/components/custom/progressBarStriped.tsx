import {cn} from "@coreModule/components/lib/utils.ts";

export function StripedProgress({ value = 0, className }) {
    return (
        <div
            className={cn(
                "relative h-4 w-full overflow-hidden rounded-full bg-muted",
                className
            )}
        >
            <div
                className="h-full bg-primary transition-all relative overflow-hidden"
                style={{ width: `${value}%` }}
            >
                <div
                    className="absolute inset-0 animate-stripes"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0px, rgba(255,255,255,0.25) 10px, transparent 10px, transparent 20px)",
                        backgroundSize: "40px 40px",
                    }}
                />
            </div>
        </div>
    )
}