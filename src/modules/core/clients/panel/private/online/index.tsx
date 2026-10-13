import {compose} from "redux";
import ServerHealth from "./serverHealth";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";
import ServerStats from "@coreModule/clients/panel/private/online/serverStats";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import Forbidden from "@coreModule/components/custom/pages/forbidden.tsx";

type OnlineResourcesProps = WithLanguageType & {}

function OnlineResources({
    resolveLanguageKey,
}: OnlineResourcesProps){
    const minute = useAccess("serverPerformance1m").read;
    const hour = useAccess("serverPerformance1h").read;
    const day = useAccess("serverPerformance1d").read;
    const read = minute === false || hour === false || day === false ? false
        : minute === null || hour === null || day === null ? null
        : minute;
    if (read === null) return null;
    if (!read) return <Forbidden />;

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

            <div className="flex-full gap-y-4 pb-24">
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