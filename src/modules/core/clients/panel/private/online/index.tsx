import {compose} from "redux";
import ServerHealth from "./serverHealth";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";
import ServerStats from "@coreModule/clients/panel/private/online/serverStats";

type OnlineResourcesProps = WithLanguageType & {}

function OnlineResources({
    resolveLanguageKey,
}: OnlineResourcesProps){

    return (
        <div className="flex-full">

            <div>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>{resolveLanguageKey("title")}</h1>
                        <p className='text-muted-foreground'>{resolveLanguageKey("description")}</p>
                    </div>
                </div>
                <Separator className="mt-2 mb-4" />
            </div>

            <div className="flex-full space-y-4 pb-24">
                <div>
                    <ServerHealth />
                </div>
                 <ServerStats />
            </div>
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/index.tsx")
)(OnlineResources)