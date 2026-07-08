import { ContentSection } from '../components/content-section.tsx'
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import UserAccountProfileUserInfo
    from "@coreModule/clients/panel/private/accountSettings/account/userInfo";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";

type AccountProps = WithLanguageType & {
    specificUserId?: string
}

function Account({
    resolveLanguageKey,
    specificUserId
}: AccountProps) {

    return (
        <ContentSection
            title={resolveLanguageKey("title")}
            desc={resolveLanguageKey("description")}
        >
            <UserAccountProfileUserInfo specificUserId={specificUserId}/>
        </ContentSection>
    )
}


export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/index.tsx"),
    withDebug(true, true)
)(Account);