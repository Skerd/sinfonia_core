import { DialogDescription, DialogHeader, DialogTitle } from "@coreModule/components/ui/dialog.tsx";
import CreateUserForm from "@coreModule/clients/panel/private/users/createUser/createUser.form.tsx";
import type { ApiSelectCreateAdapterProps } from "@coreModule/components/custom/apiSelect/createFromSearchTypes.ts";
import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";

type Props = ApiSelectCreateAdapterProps & WithLanguageType;

/**
 * Inner content for ApiSelect-owned Dialog (user create). Dialog shell is in ApiSelect.
 */
function CreateUserInlineAdapterInner({ resolveLanguageKey, onCreated, onCancel, defaultNameQuery, postBody }: Props) {
    const administration =
        postBody?.administration === true ||
        postBody?.administration === "true" ||
        String(postBody?.administration ?? "") === "true";

    return (
        <>
            <DialogHeader className="text-start">
                <DialogTitle>{String(resolveLanguageKey(administration ? "administrationTitle" : "title"))}12312312</DialogTitle>
                <DialogDescription>
                    {String(resolveLanguageKey(administration ? "administrationDescription" : "description"))}
                </DialogDescription>
            </DialogHeader>
            <CreateUserForm
                administration={administration}
                onClose={onCancel}
                inlineOnUserCreated={(id: string, label: string) => {
                    onCreated(id, label);
                }}
                prefillNameQuery={defaultNameQuery}
            />
        </>
    );
}

export default withLanguage("src/modules/core/clients/panel/private/users/createUser/index.tsx")(CreateUserInlineAdapterInner);
