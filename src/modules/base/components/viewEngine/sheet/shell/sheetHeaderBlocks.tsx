import type {ReactNode} from "react";
import type {SheetHeaderConfig, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ResolveLanguageKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {SheetDescription, SheetTitle} from "@coreModule/components/ui/sheet.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import HiddenElement from "@baseModule/components/custom/hiddenElement.tsx";
import TooltipDisplayer from "@baseModule/components/custom/tooltipDisplayer.tsx";
import {hasAccessPath} from "../../engine/access.ts";
import {affix} from "../../engine/format.ts";
import {resolvePath} from "../../engine/refs.ts";
import type {AccessMap} from "../../engine/types.ts";
import {resolveIcon} from "../../registry/icons.ts";

type HeaderBlockProps = {
    header: SheetHeaderConfig | undefined;
    /** Escape hatch from the page; wins over the config. */
    override: ReactNode | undefined;
    data: Record<string, any>;
    readAccess: AccessMap;
    resolveLanguageKey: ResolveLanguageKey;
};

/**
 * `header.titleField` (translated through `titleFieldLanguageCategory` when set) plus the
 * `subtitleKey` badge; without a header config, the row's `name`.
 */
export function SheetTitleBlock({header, override, data, readAccess, resolveLanguageKey: t}: HeaderBlockProps) {
    if (override) {
        return (
            <SheetTitle className="flex flex-wrap items-center gap-2 mb-0">
                <HiddenElement>{override}</HiddenElement>
            </SheetTitle>
        );
    }

    if (!header) {
        return (
            <SheetTitle className="flex flex-wrap items-center gap-2 mb-0">
                <HiddenElement randomLength={10}>
                    {hasAccessPath(readAccess, "name") && data.name ? (
                        <span className="truncate min-w-0 max-w-full block">{data.name}</span>
                    ) : null}
                </HiddenElement>
            </SheetTitle>
        );
    }

    const raw = resolvePath(data, header.titleField);
    const category = header.titleFieldLanguageCategory;
    const translatable = raw != null && raw !== "" && ["string", "number", "boolean"].includes(typeof raw);
    const title = category && translatable ? t(`${category}.${String(raw)}`) : raw;
    const titleText = title != null && title !== "" ? String(title) : "";

    return (
        <SheetTitle className="flex flex-col flex-wrap justify-center gap-1 min-w-0">
            <HiddenElement randomLength={10}>
                {hasAccessPath(readAccess, header.titleField) ? (
                    <TooltipDisplayer tooltip={titleText || t(header.titleField)}>
                        <p className={`truncate min-w-0 max-w-full ${header.titleClassName ?? "md:text-xl"}`}>{title}</p>
                    </TooltipDisplayer>
                ) : null}
            </HiddenElement>
            {header.subtitleKey && <Badge variant="secondary">{t(header.subtitleKey)}</Badge>}
        </SheetTitle>
    );
}

/** A `header.badges` entry has a field, its `dependent` value is truthy and its `read` key is granted. */
function badgeVisible(node: ViewNode, data: Record<string, any>, readAccess: AccessMap): node is ViewNode & {field: NonNullable<ViewNode["field"]>} {
    if (!node.field) return false;
    if (node.dependent && !resolvePath(data, node.dependent)) return false;
    return !node.permissions?.read || hasAccessPath(readAccess, node.permissions.read);
}

/** One header badge: the field value (with `prefix`) and optional icon. */
function HeaderBadge({node, data}: {node: ViewNode & {field: NonNullable<ViewNode["field"]>}; data: Record<string, any>}) {
    const field = node.field;
    const wp = field.widgetProps ?? {};
    const raw = resolvePath(data, field.name);
    const value = typeof raw === "string" && raw ? affix(raw, wp.prefix) : raw;
    const Icon = wp.icon ? resolveIcon(wp.icon) : null;

    return (
        <HiddenElement>
            {value && (
                <Badge {...(node.props ?? {})}>
                    {Icon && <Icon className="h-3 w-3 mr-1" />}
                    {value}
                </Badge>
            )}
        </HiddenElement>
    );
}

export function SheetDescriptionBlock({header, override, data, readAccess}: HeaderBlockProps) {
    if (override) {
        return <SheetDescription className="flex flex-wrap gap-1">{override}</SheetDescription>;
    }
    const badges = (header?.badges ?? []).filter((node) => badgeVisible(node, data, readAccess));
    if (badges.length === 0) return null;
    return (
        <SheetDescription className="flex flex-wrap gap-1">
            {badges.map((node, i) => (
                <HeaderBadge key={i} node={node} data={data} />
            ))}
        </SheetDescription>
    );
}
