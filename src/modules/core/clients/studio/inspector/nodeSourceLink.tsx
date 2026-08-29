import {useEffect, useState} from "react";
import {IconExternalLink, IconGitFork} from "@tabler/icons-react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {
    editorLink,
    resolveNode,
    shortPath,
    type SourceNodeRef,
} from "../source/sourceClient.ts";

type NodeSourceLinkProps = {
    /** `${model}:${viewKey}`, or undefined when the source index is unavailable. */
    target?: string;
    nodePath: string | null;
};

/**
 * Where this node is declared, and a way to open it.
 *
 * The Studio edits the API payload, which is the materialised result of a `*.views.ts` — so
 * until now the answer to "where does this actually live?" was to grep 124 files. The dev
 * server resolves it exactly, including across an imported fragment.
 *
 * Silent when the dev-server routes are absent: this is `npm run studio` tooling, and the
 * editor has to stay usable without it.
 */
export default function NodeSourceLink({target, nodePath}: NodeSourceLinkProps) {
    const [ref, setRef] = useState<SourceNodeRef | null>(null);

    useEffect(() => {
        if (!target || nodePath === null) {
            setRef(null);
            return;
        }
        let cancelled = false;
        resolveNode(target, nodePath).then((result) => {
            if (!cancelled) setRef(result);
        });
        return () => {
            cancelled = true;
        };
    }, [target, nodePath]);

    if (!ref) return null;

    const shared = ref.sharedVia;

    return (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <a
                href={editorLink(ref)}
                className="flex items-center gap-1 font-mono text-3xs text-muted-foreground hover:text-foreground hover:underline"
            >
                <IconExternalLink className="size-3 shrink-0" />
                {shortPath(ref.file)}:{ref.line}
            </a>
            {shared && (
                <TooltipDisplayer
                    tooltip={
                        `This node is declared in \`${shared.name}\`, shared by ` +
                        `${shared.usedBy.join(", ")}. Editing it there changes all of them.`
                    }
                >
                    <span className="flex items-center gap-1 rounded border border-warning/40 bg-warning/10 px-1 font-mono text-3xs text-warning">
                        <IconGitFork className="size-3 shrink-0" />
                        {shared.name}
                    </span>
                </TooltipDisplayer>
            )}
        </div>
    );
}
