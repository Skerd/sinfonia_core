import {IconCheck, IconPencil, IconX} from "@tabler/icons-react";
import {compose} from "redux";
import {useEffect, useImperativeHandle, useState} from "react";
import {useDispatch} from "react-redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import mainConfig from "@coreModule/assets/languages/mainConfig.json";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {SimpleSelect} from "@coreModule/components/viewEngine/widgets/inputs/simpleSelect.tsx";
import {pickLanguage} from "@coreModule/helpers/redux/slices/languageSlice.ts";
import {updatePreferredLanguage} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {toSupportedLocale} from "@coreModule/helpers/general/preferredLanguage.ts";
import type {SupportedLocale} from "armonia/src/modules/core/constants/index.ts";
import type {UpdateUserProfileLanguageFormType} from "armonia/src/modules/core/api/user/private/data/updateUserProfileLanguage.form.type.ts";
import type {UpdateUserProfileLanguageFormResponseType} from "armonia/src/modules/core/api/user/private/data/updateUserProfileLanguage.form.response.type.ts";

type SupportedLanguage = {languageCode: string; name: string};

const LANGUAGE_OPTIONS = (mainConfig.supportedLanguages as SupportedLanguage[]).map((language) => ({
    value: language.languageCode,
    label: language.name,
}));

type AccountProfileLanguageProps = WithLanguageType
    & WithAxiosType<UpdateUserProfileLanguageFormResponseType, UpdateUserProfileLanguageFormType>
    & {
        defaultValue?: SupportedLocale,
        specificUserId?: string,
        onUpdate?: (preferredLanguage: SupportedLocale) => void,
    };

/**
 * The language the user's SMS, WhatsApp and Telegram notices are written in (D128). Saving it also switches the panel
 * to that language, since the panel keeps the two in step (`usePreferredLanguageSync`). Only the user can change it.
 */
function AccountProfileLanguage({
    resolveLanguageKey,
    loading,
    onFilterChange,
    innerRef,
    defaultValue,
    specificUserId,
    onUpdate = () => {},
}: AccountProfileLanguageProps) {
    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");
    const dispatch = useDispatch();
    const [current, setCurrent] = useState<SupportedLocale | undefined>(defaultValue);
    const [draft, setDraft] = useState<SupportedLocale | undefined>(defaultValue);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        setCurrent(defaultValue);
    }, [defaultValue]);

    useImperativeHandle(innerRef, () => ({
        success: () => {
            if (!draft) return;
            setCurrent(draft);
            setEditing(false);
            dispatch(updatePreferredLanguage(draft));
            dispatch(pickLanguage(draft));
            onUpdate(draft);
        },
    }));

    if (!read.preferredLanguage) {
        return <HiddenElement />;
    }

    const canEdit = !specificUserId && !!write.preferredLanguage;
    const currentLabel = LANGUAGE_OPTIONS.find((option) => option.value === current)?.label;

    return (
        <section className="flex flex-col gap-1 rounded-lg border border-border/50 p-(--density-pad)">
            <div className="flex min-h-7 items-center justify-between gap-2">
                <h4 className="text-sm font-medium">{resolveLanguageKey("title")}</h4>
                {canEdit && !editing && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setDraft(current);
                            setEditing(true);
                        }}
                    >
                        <IconPencil size={14} />
                        {resolveLanguageKey("edit")}
                    </Button>
                )}
            </div>
            {editing ? (
                <form
                    className="flex gap-x-1"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (draft && draft !== current) onFilterChange({preferredLanguage: draft});
                    }}
                >
                    <SimpleSelect
                        options={LANGUAGE_OPTIONS}
                        value={draft ?? ""}
                        onValueChange={(value: string | string[]) => setDraft(toSupportedLocale(value) ?? draft)}
                        placeholder={resolveLanguageKey("title")}
                        disabled={loading}
                        className="min-w-0 w-full"
                    />
                    <TooltipDisplayer tooltip={resolveLanguageKey("confirm")} contentClassName="text-sm">
                        <Button
                            type="submit"
                            variant="outline"
                            size="icon"
                            className="h-full px-2 text-success"
                            disabled={loading || !draft || draft === current}
                            aria-label={resolveLanguageKey("confirm")}
                        >
                            <IconCheck className="h-4 w-4" />
                        </Button>
                    </TooltipDisplayer>
                    <TooltipDisplayer tooltip={resolveLanguageKey("cancel")} contentClassName="text-sm">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-full px-2 text-destructive hover:border-destructive hover:dark:border-destructive"
                            disabled={loading}
                            onClick={() => setEditing(false)}
                            aria-label={resolveLanguageKey("cancel")}
                        >
                            <IconX className="h-4 w-4" />
                        </Button>
                    </TooltipDisplayer>
                </form>
            ) : (
                <div className="flex flex-col gap-1">
                    {currentLabel
                        ? <p className="text-base font-medium text-foreground">{currentLabel}</p>
                        : <p className="text-sm text-muted-foreground">{resolveLanguageKey("empty")}</p>}
                    <p className="text-sm text-muted-foreground">{resolveLanguageKey("description")}</p>
                </div>
            )}
        </section>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/language/index.tsx"),
    withAxios(
        {
            url: "/api/user/data/language",
            method: "patch",
            data: {},
        },
        true
    ),
    withDebug(true, true, "users")
)(AccountProfileLanguage);
