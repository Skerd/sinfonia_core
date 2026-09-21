/** Props for inline "create from search" adapters (Sinfonia). */
export type ApiSelectCreateAdapterProps = {
    onCreated: (id: string, label: string) => void;
    onCancel: () => void;
    defaultNameQuery?: string;
    postBody?: Record<string, unknown>;
    formExtras?: Record<string, unknown>;
};
