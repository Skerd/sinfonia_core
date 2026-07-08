declare module "react-mentions" {
    import type {CSSProperties, KeyboardEvent, ReactNode} from "react";
    import type {ComponentType, Ref} from "react";

    export type MentionsInputStyle = (element: string) => CSSProperties;

    export type MentionDataItem = {
        id: string | number;
        display?: string;
    };

    export type MentionsInputProps = {
        value?: string;
        onChange?: (
            event: {target: {value: string}},
            newValue: string,
            newPlainTextValue: string,
            mentions: unknown[]
        ) => void;
        onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
        singleLine?: boolean;
        disabled?: boolean;
        readOnly?: boolean;
        id?: string;
        placeholder?: string;
        "aria-label"?: string;
        className?: string;
        style?: MentionsInputStyle | Record<string, unknown>;
        inputRef?: Ref<HTMLTextAreaElement | null>;
        allowSuggestionsAboveCursor?: boolean;
        forceSuggestionsAboveCursor?: boolean;
        a11ySuggestionsListLabel?: string;
        children: ReactNode;
    };

    export type MentionProps = {
        trigger?: string | RegExp;
        data: MentionDataItem[] | ((query: string, callback: (results: MentionDataItem[]) => void) => void);
        markup?: string;
        displayTransform?: (id: string, display: string) => string;
        renderSuggestion?: (
            suggestion: MentionDataItem,
            search: string,
            highlightedDisplay: ReactNode,
            index: number,
            focused: boolean
        ) => ReactNode;
        appendSpaceOnAdd?: boolean;
        className?: string;
    };

    export const MentionsInput: ComponentType<MentionsInputProps>;
    export const Mention: ComponentType<MentionProps>;
}
