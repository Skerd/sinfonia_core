import { Button } from '@coreModule/components/ui/button.tsx'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger
} from '@coreModule/components/ui/dropdown-menu.tsx'
import {useDispatch, useSelector} from "react-redux";
import mainConfig from "@coreModule/assets/languages/mainConfig.json";
import {RootState} from "@baseModule/helpers/redux/store/generalStore.ts";
import {changeLanguage} from "@baseModule/helpers/redux/slices/languageSlice.ts";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";

type SupportedLanguage = {
    languageCode: string,
    name: string,
    shortCode: string,
}

const supportedLanguages = mainConfig.supportedLanguages as SupportedLanguage[]

type LanguageSwitchProps = WithLanguageType & {
    showTitles?: boolean,
}

function LanguageSwitch({resolveLanguageKey, showTitles = false}: LanguageSwitchProps) {
    const dispatch = useDispatch();
    const languageCode = useSelector((state: RootState) => state.language.languageCode);
    const currentLanguage = supportedLanguages.find((language) => language.languageCode === languageCode);

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant='ghost'
                    size={showTitles ? "default" : "icon"}
                    className="hover:cursor-pointer gap-1"
                    aria-label={resolveLanguageKey("selectLanguage")}
                >
                    {
                        currentLanguage &&
                        <div className="flex items-center gap-x-1">
                            <img alt="supported_language_flag" className="size-[1.2rem] rounded-full object-cover" src={`/flags/${currentLanguage.languageCode}.png`}/>
                            {showTitles && <p>{currentLanguage.name}</p>}
                        </div>
                    }
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={showTitles ? "center" : "end"}
                className="w-max"
            >
                <DropdownMenuLabel className="text-2xs font-normal text-muted-foreground">
                    {resolveLanguageKey("selectLanguage")}
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                    value={languageCode}
                    onValueChange={(next) => dispatch(changeLanguage(next))}
                >
                    {
                        supportedLanguages.map((language) => (
                            <DropdownMenuRadioItem
                                key={language.languageCode}
                                value={language.languageCode}
                                className="whitespace-nowrap"
                            >
                                <img alt="supported_language_flag" className="size-4 rounded-full object-cover" src={`/flags/${language.languageCode}.png`}/>
                                <p>{language.name}</p>
                            </DropdownMenuRadioItem>
                        ))
                    }
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default withLanguage("src/modules/core/components/custom/preferences/languageSwitch.tsx")(LanguageSwitch)
