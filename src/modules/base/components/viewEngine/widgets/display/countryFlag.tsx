import {cn} from "@coreModule/components/lib/utils.ts";

/** Widths flagcdn serves as fixed rasters. */
const CDN_WIDTHS = [20, 40, 80, 160, 320];

/** One bucket up from twice the CSS width, so the flag stays crisp on retina and when cropped. */
function sourceWidth(width: number): number {
    return CDN_WIDTHS.find((candidate) => candidate >= width * 2) ?? CDN_WIDTHS[CDN_WIDTHS.length - 1];
}

export default function CountryFlag({
    code,
    width = 24,
    height = 18,
    className,
}: {code: string, width?: number, height?: number, className?: string}) {
    const flagUrl = `https://flagcdn.com/w${sourceWidth(width)}/${code.toLowerCase()}.png`
    return (
        <img
            src={flagUrl}
            alt=""
            width={width}
            height={height}
            className={cn("rounded-sm shrink-0", className)}
            loading="lazy"
        />
    )
}
