import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@coreModule/components/ui/select.tsx";
import {ArrowDownAZ, ArrowUpAZ, SlidersHorizontal} from "lucide-react";
import {ChangeEvent, useEffect, useState} from "react";
import Telegram from "@coreModule/clients/panel/private/apps/apps/telegram";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Header from "@coreModule/components/custom/header.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type AppType = 'all' | 'connected' | 'notConnected';
type ApplicationType = {
    key: string,
    name: string,
    logo: string,
    desc: string,
    connected: boolean
}

type AppsProps = WithLanguageType & {}
function Apps({
    currentLanguage,
    resolveLanguageKey
}: AppsProps){

    const {read} = useAccess("users");
    const appText = new Map<AppType, string>([
        ['all', resolveLanguageKey("dropDown.allApps")],
        ['connected', resolveLanguageKey("dropDown.connected")],
        ['notConnected', resolveLanguageKey("dropDown.notConnected")],
    ])
    const [apps, setApps] = useState<ApplicationType[]>([]);
    const [filteredApps, setFilteredApps] = useState<ApplicationType[]>([]);
    const [sort, setSort] = useState("asc");
    const [appType, setAppType] = useState<AppType>("all");
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
    }
    const handleTypeChange = (value: AppType) => {
        setAppType(value)
    }
    const handleSortChange = (sort: 'asc' | 'desc') => {
        setSort(sort)
    }

    useEffect(() => {
        if( !!currentLanguage ){
            setApps(Object.values(resolveLanguageKey("appsList")));
        }
    }, [currentLanguage]);
    useEffect(() => {
        if( !!apps ){
            setFilteredApps(apps.sort((a, b) => sort === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
                .filter((app) => appType === 'connected' ? app.connected : appType === 'notConnected' ? !app.connected : true)
                .filter((app) => app.name.toLowerCase().includes(searchTerm.toLowerCase())))
        }
    }, [apps, appType, sort, searchTerm]);

    return (
        <div className="flex-full gap-4">

            <Header title={resolveLanguageKey("title")} description={resolveLanguageKey("description")}/>

            <div className="flex-full gap-4">

                <div className='flex items-end justify-between sm:items-center'>
                    <div className='flex flex-col gap-2 sm:flex-row'>
                        <Input
                            placeholder={resolveLanguageKey("filterApps") + "..."}
                            className='w-40 lg:w-[250px]'
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        <Select value={appType} onValueChange={handleTypeChange}>
                            <SelectTrigger className='w-36'>
                                <SelectValue>{appText.get(appType)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>{resolveLanguageKey("dropDown.allApps")}</SelectItem>
                                <SelectItem value='connected'>{resolveLanguageKey("dropDown.connected")}</SelectItem>
                                <SelectItem value='notConnected'>{resolveLanguageKey("dropDown.notConnected")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Select value={sort} onValueChange={handleSortChange}>
                        <SelectTrigger className='w-16'>
                            <SelectValue>
                                <SlidersHorizontal size={18} />
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent align='end'>
                            <SelectItem value='asc'>
                                <div className='flex items-center gap-4'>
                                    <ArrowUpAZ size={16} />
                                    <span>{resolveLanguageKey("order.ascending")}</span>
                                </div>
                            </SelectItem>
                            <SelectItem value='desc'>
                                <div className='flex items-center gap-4'>
                                    <ArrowDownAZ size={16} />
                                    <span>{resolveLanguageKey("order.descending")}</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <ul className='faded-bottom no-scrollbar grid gap-2 overflow-auto md:grid-cols-2 lg:grid-cols-3'>
                    <HiddenElement>
                        {
                            read &&
                            <>
                                {
                                    filteredApps.map((app) => {
                                        if( app.key === "telegram"){
                                            return <Telegram />
                                        }
                                        return (
                                            <></>
                                        )
                                    })
                                }
                            </>
                        }
                    </HiddenElement>
                </ul>
            </div>
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/apps/index.tsx"),
    withDebug(true, true)
)(Apps);