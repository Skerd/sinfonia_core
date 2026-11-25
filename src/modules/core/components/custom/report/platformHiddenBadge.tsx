import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

type Props = {
    /** The record's `hiddenByPlatform` (platformHiddenPlugin, D191). */
    hidden?: boolean;
    className?: string;
};

/** "Hidden by the platform" on a company's own record the platform hid after a report; its panel still lists it. */
function PlatformHiddenBadgeInner({hidden, className, resolveLanguageKey}: Props & WithLanguageType) {
    if (!hidden) return null;
    return <Badge variant="destructive" className={cn("text-xs", className)}>{String(resolveLanguageKey("hiddenByPlatform"))}</Badge>;
}

const PlatformHiddenBadgeConnected = compose(withLanguage("src/modules/core/components/custom/report/platformHiddenBadge.tsx"))(PlatformHiddenBadgeInner);

export default function PlatformHiddenBadge(props: Props) {
    return <PlatformHiddenBadgeConnected {...props} />;
}
