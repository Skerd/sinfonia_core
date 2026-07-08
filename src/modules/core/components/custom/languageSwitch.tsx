import { cn } from "@coreModule/components/lib/utils.ts"
import { Check } from 'lucide-react'
import { Button } from '@coreModule/components/ui/button.tsx'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@coreModule/components/ui/dropdown-menu.tsx'
import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import mainConfig from "@coreModule/assets/languages/mainConfig.json";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {changeLanguage} from "@coreModule/helpers/redux/slices/languageSlice.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";

type LanguageSwitchProps = WithLanguageType & {
    showTitles?: boolean,
}

function LanguageSwitch({resolveLanguageKey, showTitles = false}: LanguageSwitchProps) {
    const dispatch = useDispatch();
    const supportedLanguages = mainConfig.supportedLanguages;
    const languageCode = useSelector((state: RootState) => state.language.languageCode);

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant='ghost' size={showTitles ? "default" : "icon"} aria-label={resolveLanguageKey("selectLanguage")}>
                    {
                        supportedLanguages?.filter((tempLanguage: any) => tempLanguage.languageCode === languageCode).map((language: any, index: number) => {
                            return (
                                <div className="flex items-center justify-center hover:cursor-pointer space-x-1" key={"generated_language_select_" + index}>
                                    <img alt="supported_language_flag" className="size-[1.2rem]" src={`/flags/${language.languageCode}.png`}/>
                                    {
                                        showTitles &&
                                        <p>{language.name}</p>
                                    }
                                </div>
                            )
                        })
                    }
                    <span className='sr-only'>{resolveLanguageKey("selectLanguage")}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={showTitles ? "center" : "end"}>
                {
                    showTitles &&
                    <>
                        <DropdownMenuLabel>{resolveLanguageKey("selectLanguage")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                    </>
                }
                {
                    supportedLanguages?.map((language: any, index: number) => {
                        return (
                            <DropdownMenuItem
                                key={"generated_language_select_" + index}
                                onClick={() => {dispatch(changeLanguage(language.languageCode));}}
                            >
                                <div className="flex items-center space-x-1">
                                    <img alt="supported_language_flag" className="ms-auto size-4" src={`/flags/${language.languageCode}.png`}/>
                                    <p>{language.name}</p>
                                </div>
                                <Check className={cn('ms-auto', languageCode !== language.languageCode && 'hidden')}/>
                            </DropdownMenuItem>
                        )
                    })
                }
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default compose(
    withLanguage("src/modules/core/components/custom/languageSwitch.tsx")
)(LanguageSwitch)