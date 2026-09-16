import {compose} from "redux";
import PasswordStrengthBar from "react-password-strength-bar";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";

type PasswordStrengthProps = WithLanguageType & {
    password: string
}

function PasswordStrength({
    password,
    resolveLanguageKey,
    resolveLanguageValue
}: PasswordStrengthProps){

    return (
        <PasswordStrengthBar
            className="w-[50%]"
            password={password}
            minLength={8}
            shortScoreWord={resolveLanguageKey("passwordTooShort")}
            scoreWords={resolveLanguageValue<string[]>("passwordStages") ?? undefined}
        />
    )
}

export default compose(
    withLanguage("src/modules/core/components/custom/passwordStrength.tsx")
)(PasswordStrength)
