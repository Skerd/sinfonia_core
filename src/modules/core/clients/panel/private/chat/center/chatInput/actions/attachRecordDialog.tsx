import {useEffect, useMemo, useState} from "react";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@coreModule/components/ui/dialog.tsx";
import {SimpleSelect} from "@coreModule/components/viewEngine/widgets/inputs/simpleSelect.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import {MediaAvatar} from "@coreModule/components/viewEngine/widgets/display/mediaAvatar.tsx";
import {useRecordTypeLabel, type ChatRecordSuggestion} from "@coreModule/helpers/chat/chatRecords.tsx";
import type {
    ChatRecordTypesFormResponseType,
    SearchChatRecordsFormResponseType,
} from "armonia/src/modules/core/api/user/private/chats/records/records.form.response.type";

const TYPES_REQUEST = {method: "post" as const, url: "/api/user/chats/records/types", data: {}};
const SEARCH_REQUEST = {method: "post" as const, url: "/api/user/chats/records/search", data: {}};
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 250;

type AttachRecordDialogProps = WithLanguageType & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The record picked; the dialog closes itself. */
    onPick: (record: ChatRecordSuggestion) => void;
};

/**
 * Picks any record the user may read to share in a message (D162): choose its kind, then search it. The `@` list in the
 * composer offers the first few matches of every kind; this reaches the rest.
 */
function AttachRecordDialog({open, onOpenChange, onPick, resolveLanguageKey}: AttachRecordDialogProps) {
    const typeLabel = useRecordTypeLabel();
    const [collection, setCollection] = useState("");
    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(query.trim()), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [query]);

    const types = useHttpRequest<ChatRecordTypesFormResponseType>(TYPES_REQUEST, {}, open ? 1 : 0);
    const typeOptions = useMemo(
        () => (types.data?.collections ?? [])
            .map((value) => ({value, label: typeLabel(value)}))
            .sort((a, b) => a.label.localeCompare(b.label)),
        [types.data, typeLabel],
    );

    /* One request per kind + search, sent when either changes while the dialog is open. */
    const searchKey = open && collection ? `${collection}|${debounced}` : "";
    const [search, setSearch] = useState({key: searchKey, count: 0});
    if (search.key !== searchKey) {
        setSearch({key: searchKey, count: searchKey ? search.count + 1 : search.count});
    }
    const searchData = useMemo(
        () => ({collection, limit: PAGE_SIZE, ...(debounced ? {q: debounced} : {})}),
        [collection, debounced],
    );
    const results = useHttpRequest<SearchChatRecordsFormResponseType>(SEARCH_REQUEST, searchData, search.count);
    const items = searchKey ? results.data?.groups[0]?.items ?? [] : [];

    function close(next: boolean) {
        onOpenChange(next);
        if (!next) {
            setQuery("");
            setDebounced("");
        }
    }

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{resolveLanguageKey("title")}</DialogTitle>
                    <DialogDescription>{resolveLanguageKey("description")}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label>{resolveLanguageKey("type")}</Label>
                        {/* Searchable: a company with every module offers some 80 kinds. */}
                        <SimpleSelect
                            options={typeOptions}
                            value={collection}
                            onValueChange={(value: string | string[]) => setCollection(String(value))}
                            placeholder={resolveLanguageKey("chooseType")}
                            searchPlaceholder={resolveLanguageKey("searchType")}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="attach-record-search">{resolveLanguageKey("search")}</Label>
                        <Input
                            id="attach-record-search"
                            value={query}
                            disabled={!collection}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={resolveLanguageKey("searchPlaceholder")}
                        />
                    </div>

                    <div className="max-h-72 min-h-24 overflow-y-auto rounded-md border" role="listbox" aria-label={resolveLanguageKey("results")}>
                        {!collection ? (
                            <p className="p-3 text-sm text-muted-foreground">{resolveLanguageKey("chooseTypeFirst")}</p>
                        ) : results.loading ? (
                            <Loader />
                        ) : items.length === 0 ? (
                            <p className="p-3 text-sm text-muted-foreground">{resolveLanguageKey("noResults")}</p>
                        ) : (
                            items.map((item) => (
                                <Button
                                    key={item.id}
                                    type="button"
                                    variant="ghost"
                                    role="option"
                                    aria-selected={false}
                                    className="flex h-auto w-full justify-start gap-2 rounded-none px-3 py-2 text-left font-normal"
                                    onClick={() => {
                                        onPick({collection, id: item.id, label: item.label, photo: item.photo});
                                        close(false);
                                    }}
                                >
                                    <MediaAvatar mediaId={item.photo} alt="" className="size-7 shrink-0 rounded-md" fallback={item.label.charAt(0).toUpperCase()} />
                                    <span className="truncate">{item.label}</span>
                                </Button>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default withLanguage("src/modules/core/clients/panel/private/chat/center/chatInput/actions/attachRecordDialog.tsx")(AttachRecordDialog);
