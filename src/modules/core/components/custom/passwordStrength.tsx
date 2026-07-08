import {compose} from "redux";
import PasswordStrengthBar from "react-password-strength-bar";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";

type PasswordStrengthProps = WithLanguageType & {
    password: string
}

function PasswordStrength({
    password,
    resolveLanguageKey
}: PasswordStrengthProps){

    return (
        <PasswordStrengthBar
            className="w-[50%]"
            password={password}
            minLength={8}
            shortScoreWord={resolveLanguageKey("passwordTooShort")}
            scoreWords={resolveLanguageKey("passwordStages")}
        />
    )
}

export default compose(
    withLanguage("src/modules/core/components/custom/passwordStrength.tsx")
)(PasswordStrength)
