import {compose} from "redux";
import {useMemo, useState, isValidElement, type ReactNode} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

function plainTextFromChildren(node: ReactNode): string {
    if (node == null || typeof node === "boolean") return "";
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(plainTextFromChildren).join("");
    if (isValidElement(node) && node.props != null && typeof node.props === "object" && "children" in node.props) {
        return plainTextFromChildren((node.props as {children?: ReactNode}).children as ReactNode);
    }
    return "";
}

export type ExpandableTextProps = WithLanguageType & {
    children: ReactNode;
    /** Character count shown before toggling; full text is shown when expanded. */
    maxLength?: number;
    className?: string;
    show?: boolean,
};

function ExpandableText({children, maxLength = 250, className, resolveLanguageKey, show = true}: ExpandableTextProps) {
    const [expanded, setExpanded] = useState(false);
    const text = useMemo(() => plainTextFromChildren(children), [children]);
    const limit = Math.max(0, maxLength);
    const needsToggle = text.length > limit;

    if( !show ) {
        return (
            <div className={cn(className)}>
                <HiddenElement />
            </div>
        )
    }

    if( !text ) {
        return (
            <div className={cn(className)}>
                <ValueNotSet />
            </div>
        )
    }

    if (!needsToggle) {
        return (
            <span className={cn("whitespace-pre-wrap wrap-break-word leading-relaxed", className)}>
                {text}
            </span>
        );
    }

    return (
        <div className={cn("whitespace-pre-wrap wrap-break-word leading-relaxed ", className)}>
            <div>
                {expanded ? text : `${text.slice(0, limit)}...`}
            </div>
            <div className="mt-1">
                <Button
                    type="button"
                    variant="link"
                    className="h-auto min-h-0 p-0 text-inherit underline-offset-4 print:hidden"
                    onClick={() => setExpanded((v) => !v)}
                >
                    {expanded ? String(resolveLanguageKey("readLess")) : String(resolveLanguageKey("readMore"))}
                </Button>
            </div>
        </div>
    );
}

export default compose(withLanguage("src/modules/core/components/custom/expandableText.tsx"))(ExpandableText);
