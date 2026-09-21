import {createContext, Fragment, useContext, useEffect, useState, type ReactElement} from "react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import SingleFile from "@coreModule/components/viewEngine/widgets/media/singleFile.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import type {Media} from "armonia/src/modules/core/types";
import type {AuditFieldHint} from "@coreModule/components/viewEngine/audit/auditFieldHints.ts";
import {inferMimeFromFilename} from "@coreModule/components/viewEngine/widgets/media/mediaPreviewKind.ts";

const OBJECT_ID_HEX = /^[a-f0-9]{24}$/i;

/** Turn a known `POST …/select` URL into `POST …/single` when the convention matches auxiliary / finance routes. */
export function auditSelectUrlToSingleUrl(selectUrl: string): string | null {
    const trimmed = selectUrl.trim().replace(/\/+$/, "");
    if (/\/select$/i.test(trimmed)) {
        return `${trimmed.replace(/\/select$/i, "")}/single`;
    }
    return null;
}

export function formatAuditScalar(v: unknown): string {
    if (v === null || v === undefined) {
        return "—";
    }
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        return String(v);
    }
    try {
        const s = JSON.stringify(v);
        return s.length > 440 ? `${s.slice(0, 440)}…` : s;
    } catch {
        return String(v);
    }
}

function shortenIdHint(id: string): string {
    if (id.length <= 12) {
        return id;
    }
    return `…${id.slice(-8)}`;
}

/** Server-resolved labels for referenced ids (`DocumentAuditLogResponseDto.referenceLabels`). */
const AuditReferenceLabelsContext = createContext<Record<string, string>>({});
export const AuditReferenceLabelsProvider = AuditReferenceLabelsContext.Provider;

/** A referenced id as its label when the server resolved one, else a shortened id. */
function RefIdSpan({id}: {id: string}) {
    const label = useContext(AuditReferenceLabelsContext)[id.toLowerCase()];
    return label ? (
        <span className="break-words" title={id}>{label}</span>
    ) : (
        <span className="font-mono" title={id}>{shortenIdHint(id)}</span>
    );
}

/** Ids as a comma-separated list of labels / short ids. */
function RefIdList({ids}: {ids: string[]}) {
    return (
        <span className="inline-flex flex-wrap items-baseline gap-x-1">
            {ids.map((id, i) => (
                <Fragment key={`${id}-${i}`}>
                    {i > 0 ? ", " : null}
                    <RefIdSpan id={id} />
                </Fragment>
            ))}
        </span>
    );
}

function extractMongoId(raw: unknown): string | null {
    if (typeof raw === "string" && OBJECT_ID_HEX.test(raw.trim())) {
        return raw.trim();
    }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const o = raw as Record<string, unknown>;
        const oid = o.$oid;
        if (typeof oid === "string" && OBJECT_ID_HEX.test(oid.trim())) {
            return oid.trim();
        }
        const id = o._id;
        if (typeof id === "string" && OBJECT_ID_HEX.test(id.trim())) {
            return id.trim();
        }
    }
    return null;
}

function pickEmbeddedLabel(record: Record<string, unknown>): string | null {
    const orderedKeys = [
        "name",
        "title",
        "unitNumber",
        "label",
        "abbreviation",
        "symbol",
        "code",
        "reference",
        "email",
    ] as const;
    for (const k of orderedKeys) {
        const x = record[k];
        if (typeof x === "string" && x.trim().length > 0) {
            return x.trim();
        }
        if (typeof x === "number" && Number.isFinite(x)) {
            return String(x);
        }
    }
    return null;
}

function embeddedLabel(raw: unknown): string | null {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return null;
    }
    return pickEmbeddedLabel(raw as Record<string, unknown>);
}

function looksLikeSparseMediaStub(o: Record<string, unknown>): boolean {
    const id = o._id;
    if (typeof id !== "string" || !OBJECT_ID_HEX.test(id)) {
        return false;
    }
    const keys = Object.keys(o);
    const mediaKeys = new Set(["_id", "mime", "mimeType", "name", "originalName", "size", "file"]);
    const extra = keys.filter((k) => !mediaKeys.has(k));
    if (extra.some((k) => k !== "__v")) {
        return false;
    }
    return !!(o.mime ?? o.mimeType ?? o.name ?? o.originalName);
}

function asMediaStub(v: unknown, id: string): Media {
    const base = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
    let mime =
        (typeof base.mime === "string" ? base.mime : "") ||
        (typeof base.mimeType === "string" ? base.mimeType : "") ||
        "";
    const nameStr = (typeof base.name === "string" ? base.name : "") || (typeof base.originalName === "string" ? base.originalName : "") || "";
    if (!mime && nameStr) {
        mime = inferMimeFromFilename(nameStr);
    }
    const extension =
        typeof base.extension === "string"
            ? base.extension
            : (typeof base.originalName === "string" ? base.originalName.split(".").pop() : "") ||
              (typeof base.name === "string" ? base.name.split(".").pop() : "") ||
              "";
    return {
        _id: id,
        name: nameStr,
        mime,
        extension: typeof extension === "string" ? extension : "",
        size: typeof base.size === "number" ? base.size : 0,
        safeCheckedFlag: typeof base.safeCheckedFlag === "boolean" ? base.safeCheckedFlag : false,
    };
}

function coerceMediaSlice(raw: unknown): Media[] {
    const out: Media[] = [];

    const pushOne = (v: unknown) => {
        const id = extractMongoId(v);
        if (!id) {
            return;
        }
        out.push(asMediaStub(v, id));
    };

    if (raw === null || raw === undefined) {
        return out;
    }
    if (Array.isArray(raw)) {
        raw.forEach(pushOne);
        return out;
    }
    pushOne(raw);
    return out;
}

function normalizeSinglePayload(data: unknown): Record<string, unknown> | null {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return null;
    }
    const root = data as Record<string, unknown>;
    const inner = root.data;
    if (
        inner &&
        typeof inner === "object" &&
        !Array.isArray(inner) &&
        typeof (inner as Record<string, unknown>)._id === "string"
    ) {
        return inner as Record<string, unknown>;
    }
    return root;
}

async function fetchSingleLabel(url: string, id: string, labelFields: string[]): Promise<string | null> {
    try {
        const res = await apiClient.post<unknown>(url, {_id: id});
        const row = normalizeSinglePayload(res.data);
        if (!row) {
            return null;
        }
        const fields = labelFields.length > 0 ? labelFields : (["name", "title"] as const);
        for (const f of fields) {
            const x = row[f];
            if (typeof x === "string" && x.trim()) {
                return x.trim();
            }
            if (typeof x === "number" && Number.isFinite(x)) {
                return String(x);
            }
        }
        return pickEmbeddedLabel(row);
    } catch {
        return null;
    }
}

/**
 * One flight per `{url, id, labelFields}` keeps audit lists from repeating `/single` calls.
 * A lookup that yields no label is dropped so a later render retries it; the cache keeps the
 * most recent {@link MAX_CACHED_LABELS} lookups.
 */
const singleLabelFlight = new Map<string, Promise<string | null>>();
const MAX_CACHED_LABELS = 500;

function getResolvedLabel(url: string, id: string, labelFields: string[]): Promise<string | null> {
    const key = `${url}::${id}::${labelFields.join(",")}`;
    const cached = singleLabelFlight.get(key);
    if (cached) {
        // Re-insert to mark as recently used.
        singleLabelFlight.delete(key);
        singleLabelFlight.set(key, cached);
        return cached;
    }
    const flight = fetchSingleLabel(url, id, labelFields).then((label) => {
        if (label == null) singleLabelFlight.delete(key);
        return label;
    });
    singleLabelFlight.set(key, flight);
    if (singleLabelFlight.size > MAX_CACHED_LABELS) {
        singleLabelFlight.delete(singleLabelFlight.keys().next().value!);
    }
    return flight;
}

function AuditResolvedRefSpan({
    singleUrl,
    labelFields,
    raw,
}: {
    singleUrl: string;
    labelFields: string[];
    raw: unknown;
}) {
    const id = extractMongoId(raw);
    const serverLabel = useContext(AuditReferenceLabelsContext)[id?.toLowerCase() ?? ""];
    const embedded = embeddedLabel(raw) ?? serverLabel ?? null;

    const [text, setText] = useState<string>(() =>
        embedded ?? (id ? shortenIdHint(id) : formatAuditScalar(raw)),
    );

    const labelFieldsKey = labelFields.join("\0");

    useEffect(() => {
        let cancelled = false;
        if (embedded || !id) {
            return undefined;
        }
        void getResolvedLabel(singleUrl, id, labelFields).then((label) => {
            if (!cancelled && label) {
                setText(label);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [embedded, id, labelFieldsKey, singleUrl, labelFields]);

    return <span className="break-words">{text}</span>;
}

function AuditResolvedSelectSpan({selectUrl, raw}: {selectUrl: string; raw: unknown}) {
    const singleUrl = auditSelectUrlToSingleUrl(selectUrl);
    if (!singleUrl) {
        return <span className="break-all font-mono">{formatAuditScalar(raw)}</span>;
    }
    return (
        <AuditResolvedRefSpan singleUrl={singleUrl} labelFields={["name", "title", "label", "unitNumber"]} raw={raw} />
    );
}

function AuditPrimitiveSpan({raw, resolveLanguageKey}: {raw: unknown; resolveLanguageKey: ResolveLanguageKey}) {
    if (typeof raw === "string" && OBJECT_ID_HEX.test(raw.trim())) {
        return <RefIdSpan id={raw.trim()} />;
    }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const id = extractMongoId(raw);
        const keys = Object.keys(raw).filter((k) => k !== "__v");
        const bareId = id && ((keys.length === 1 && keys[0] === "_id") || ("$oid" in raw && keys.length <= 2 && !embeddedLabel(raw)));
        if (bareId) {
            return <RefIdSpan id={id} />;
        }
    }
    const emb = embeddedLabel(raw);
    if (emb && extractMongoId(raw)) {
        return <span className="break-words">{emb}</span>;
    }
    if (Array.isArray(raw) && raw.length > 0) {
        if (raw.every((item) => typeof item === "string" && OBJECT_ID_HEX.test(item.trim()))) {
            return <RefIdList ids={raw.map((item) => (item as string).trim())} />;
        }
        if (raw.every((item) => embeddedLabel(item) ?? extractMongoId(item))) {
            return (
                <span className="inline-flex flex-wrap items-baseline gap-x-1">
                    {raw.map((item, i) => {
                        const label = embeddedLabel(item);
                        return (
                            <Fragment key={i}>
                                {i > 0 ? ", " : null}
                                {label ? <span className="break-words">{label}</span> : <RefIdSpan id={extractMongoId(item)!} />}
                            </Fragment>
                        );
                    })}
                </span>
            );
        }
    }
    if (raw && typeof raw === "object" && !Array.isArray(raw) && looksLikeSparseMediaStub(raw as Record<string, unknown>)) {
        const [m] = coerceMediaSlice(raw);
        if (m?._id) {
            return <AuditMediaStrip resolveLanguageKey={resolveLanguageKey} media={[m]} />;
        }
    }
    return <span className="break-all font-mono">{formatAuditScalar(raw)}</span>;
}

function AuditMediaStrip({resolveLanguageKey, media}: {resolveLanguageKey: ResolveLanguageKey; media: Media[]}) {
    if (media.length === 0) {
        return <span>{formatAuditScalar(null)}</span>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {media.map((m) => (
                <div key={m._id} className={cn(media.length === 1 ? "max-w-[8rem]" : "max-w-[6rem]", " shrink-0")}>
                    <SingleFile
                        resolveLanguageKey={resolveLanguageKey}
                        file={{
                            _id: m._id,
                            file: m,
                        }}
                        canDownload
                        canRemove={false}
                        isBig={false}
                    />
                </div>
            ))}
        </div>
    );
}

function joinedResolvedRefs(parts: unknown[], renderer: (raw: unknown, idx: number) => ReactElement) {
    return (
        <span className="inline-flex flex-wrap items-baseline gap-x-1">
            {parts.map((item, idx) => (
                <Fragment key={idx}>
                    {idx > 0 ? ", " : null}
                    {renderer(item, idx)}
                </Fragment>
            ))}
        </span>
    );
}

export function AuditDiffValuePresentation({
    value,
    hint,
    resolveLanguageKey,
}: {
    value: unknown;
    hint: AuditFieldHint;
    resolveLanguageKey: ResolveLanguageKey;
}) {
    if (value === null || value === undefined) {
        return <span className="font-mono">{formatAuditScalar(value)}</span>;
    }

    switch (hint.kind) {
        case "media":
            return <AuditMediaStrip resolveLanguageKey={resolveLanguageKey} media={coerceMediaSlice(value)} />;
        case "singlePost": {
            if (Array.isArray(value)) {
                return joinedResolvedRefs(value, (item, idx) => (
                    <AuditResolvedRefSpan key={idx} singleUrl={hint.url} labelFields={hint.labelFields} raw={item} />
                ));
            }
            return <AuditResolvedRefSpan singleUrl={hint.url} labelFields={hint.labelFields} raw={value} />;
        }
        case "apiSelect":
            if (Array.isArray(value)) {
                return joinedResolvedRefs(value, (item, idx) => (
                    <AuditResolvedSelectSpan key={idx} selectUrl={hint.selectUrl} raw={item} />
                ));
            }
            return <AuditResolvedSelectSpan selectUrl={hint.selectUrl} raw={value} />;
        case "primitive":
        default:
            return <AuditPrimitiveSpan raw={value} resolveLanguageKey={resolveLanguageKey} />;
    }
}
