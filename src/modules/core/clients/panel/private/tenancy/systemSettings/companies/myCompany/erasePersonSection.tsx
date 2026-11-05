import {useState} from "react";
import {compose} from "redux";
import {useSelector} from "react-redux";
import {IconUserX} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {getMergedModuleRolesPermissions} from "@coreModule/helpers/moduleContributions/loadRolesPermissionsContributions.ts";
import {getModulePersonErasureTexts} from "@coreModule/helpers/moduleContributions/loadPersonErasureContributions.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {ErasePersonFormType} from "armonia/src/modules/core/api/company/private/privacy/erasePerson.form.validator.ts";
import type {ErasePersonResponseDto, ErasureCountDto} from "armonia/src/modules/core/api/company/private/privacy/erasePerson.dto.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@coreModule/components/ui/alert-dialog.tsx";

type Props = WithLanguageType & WithAxiosType<ErasePersonResponseDto, ErasePersonFormType> & {
    /** The company's modules: each one that erases something says what, in its own words. */
    modules: string[];
};

/**
 * A company admin erases one person, found by email, from this company's records (D57). A preview lists what would
 * change; erasing asks for the email again. Kept records are anonymised, health and identity data deleted for good.
 */
function ErasePersonSection({data, loading, modules, onFilterChange, resolveLanguageKey}: Props) {
    const languageCode = useSelector((state: RootState) => state.language.languageCode);
    const [email, setEmail] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState("");
    // Erasing always targets the email that was previewed, never one typed afterwards.
    const [previewedEmail, setPreviewedEmail] = useState("");
    const normalized = email.trim().toLowerCase();

    // Each module labels its own collections (roles screen groups), so core names no module here.
    const groups = getMergedModuleRolesPermissions(languageCode ?? "en-US")["groups"];
    const label = (collection: string): string => {
        if (collection === "media") return String(resolveLanguageKey("files"));
        const group = collection.charAt(0).toUpperCase() + collection.slice(1);
        const named = groups && typeof groups === "object" ? (groups as Record<string, unknown>)[group] : undefined;
        return typeof named === "string" ? named : collection;
    };
    const moduleTexts = getModulePersonErasureTexts(languageCode ?? "en-US");
    const effects = modules.map((name) => moduleTexts[name]).filter((text): text is string => !!text);
    const rows = (data?.counts ?? []).filter((count: ErasureCountDto) => count.anonymised + count.deleted > 0);
    const previewed = data?.preview === true && !loading && previewedEmail === normalized;
    const erased = data?.preview === false && !loading;

    return (
        <section className="flex w-full max-w-6xl flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
                <IconUserX size={16} />
                <h3 className="font-medium">{resolveLanguageKey("title")}</h3>
            </div>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <p>{resolveLanguageKey("description")}</p>
                <ul className="list-disc pl-5">
                    {effects.map((text) => <li key={text}>{text}</li>)}
                    <li>{resolveLanguageKey("chats")}</li>
                </ul>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex flex-1 flex-col gap-2">
                    <Label htmlFor="erase-person-email">{resolveLanguageKey("email")}</Label>
                    <Input id="erase-person-email" type="email" value={email} disabled={loading} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <Button type="button" variant="outline" disabled={loading || !normalized} onClick={() => { setPreviewedEmail(normalized); onFilterChange({email: normalized, preview: true}); }}>
                    {resolveLanguageKey("preview")}
                </Button>
            </div>

            {previewed ? (
                <div className="flex flex-col gap-2">
                    {rows.length === 0 ? (
                        <p className="text-sm">{resolveLanguageKey("nothingFound")}</p>
                    ) : (
                        <>
                            <ul className="flex flex-col gap-1 text-sm">
                                {rows.map((count) => (
                                    <li key={count.collection}>
                                        {label(count.collection)}: {count.anonymised > 0 ? `${count.anonymised} ${resolveLanguageKey("anonymised")}` : null}
                                        {count.anonymised > 0 && count.deleted > 0 ? ", " : null}
                                        {count.deleted > 0 ? `${count.deleted} ${resolveLanguageKey("deleted")}` : null}
                                    </li>
                                ))}
                            </ul>
                            <Button type="button" variant="destructive" className="self-start" onClick={() => { setConfirmEmail(""); setConfirmOpen(true); }}>
                                {resolveLanguageKey("erase")}
                            </Button>
                        </>
                    )}
                </div>
            ) : null}
            {erased ? <p className="text-sm">{resolveLanguageKey("done")}</p> : null}

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{resolveLanguageKey("confirmTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{resolveLanguageKey("confirmDescription")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="erase-person-confirm">{resolveLanguageKey("confirmEmail")}</Label>
                        <Input id="erase-person-confirm" type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{resolveLanguageKey("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={confirmEmail.trim().toLowerCase() !== previewedEmail}
                            onClick={() => onFilterChange({email: previewedEmail, preview: false})}
                        >
                            {resolveLanguageKey("erase")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/myCompany/erasePersonSection.tsx"),
    withAxios<ErasePersonResponseDto, ErasePersonFormType>({url: "/api/privacy/erasePerson", method: "POST", data: {}}, true),
    withDebug(true, true, "companies"),
)(ErasePersonSection);
