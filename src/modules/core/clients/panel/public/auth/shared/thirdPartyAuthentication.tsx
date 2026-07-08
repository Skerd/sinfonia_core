import {compose} from "redux";
import {Button} from "@coreModule/components/ui/button.tsx";
import {getClientConfig} from "@coreModule/helpers/general";
import mainConfig from "@coreModule/assets/languages/mainConfig.json";
import {SiApple, SiGoogle} from "@icons-pack/react-simple-icons";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";

const images: any = {
    "google": <SiGoogle />,
    "apple": <SiApple />
}

type ThirdPartyAuthenticationProps = WithLanguageType & { loading: boolean }
function ThirdPartyAuthentication({resolveLanguageKey, loading}: ThirdPartyAuthenticationProps){
    const config = getClientConfig();
    if( config.layout.activateThirdPartyAuthentication && mainConfig?.thirdPartyAuthenticators.length > 0 ){
        return (
            <>
                <div className='flex items-center'>
                    <p className='flex grow border-t h-0.5'/>
                    <div className='flex justify-center text-xs uppercase text-center text-muted-foreground px-2'>
                          {resolveLanguageKey("orContinueWith")}
                    </div>
                    <p className='flex grow border-t h-0.5'/>
                </div>
                <div className='grid grid-cols-2 gap-2'>
                    {
                        mainConfig?.thirdPartyAuthenticators?.map((party: any, index: number) => {
                            return (
                                <TooltipDisplayer key={"tooltip_authentication_" + index} tooltip={party.name} contentClassName="capitalize">
                                    <Button
                                        variant='outline'
                                        type='button'
                                        className="capitalize"
                                        disabled={loading}
                                        onClick={() => {window.location.href = party.url;}}
                                    >
                                        {images[party.name]} {party.name}
                                    </Button>
                                </TooltipDisplayer>
                            )
                        })
                    }
                </div>
            </>
        )
    }
    return (<></>)
}

export default compose(
    withLanguage("src/modules/core/clients/panel/public/auth/shared/thirdPartyAuthentication.tsx"),
    withDebug(true, true)
)(ThirdPartyAuthentication);