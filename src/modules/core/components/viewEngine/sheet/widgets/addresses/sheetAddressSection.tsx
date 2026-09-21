import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import DisplayCard from "@coreModule/components/viewEngine/widgets/display/displayCard.tsx";
import { resolveIcon } from "../../../widgetRegistry.ts";
import { useReferencesViewModeOptional } from "../references/referencesViewModeContext.tsx";
import SheetCompanyAddressesSection from "./sheetCompanyAddressesSection.tsx";

export type SheetAddressSectionProps = {
    address?: unknown;
    show?: boolean;
    resolveLanguageKey: ResolveLanguageKey;
};

export default function SheetAddressSection({
    address,
    show = true,
    resolveLanguageKey,
}: SheetAddressSectionProps) {
    const viewModeCtx = useReferencesViewModeOptional();
    const isCompact = viewModeCtx?.mode === "compact";

    if (isCompact) {
        const addr = address as Record<string, any> | null | undefined;
        const parts = [
            addr?.city?.name,
            addr?.state?.name,
            addr?.country?.name,
            addr?.street,
            addr?.postalCode,
        ].filter(Boolean);
        const addressString = parts.length > 0 ? (parts as string[]).join(", ") : null;
        const Icon = resolveIcon("#MapPin");
        const label = String(resolveLanguageKey("address"));
        return (
            <DisplayCard
                show={show}
                title={label}
                tooltip={label}
                Icon={Icon ?? undefined}
                value={addressString}
            />
        );
    }

    return (
        <SheetCompanyAddressesSection
            addresses={address}
            resolveLanguageKey={resolveLanguageKey}
            show={show}
        />
    );
}
