import PasswordStrengthBar from "react-password-strength-bar";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

type PasswordStrengthProps = WithLanguageType & {
    password: string
    className?: string
}

function PasswordStrength({
    password,
    className,
    resolveLanguageKey,
    resolveLanguageValue
}: PasswordStrengthProps){

    return (
        <PasswordStrengthBar
            className={cn("w-[50%]", className)}
            password={password}
            minLength={8}
            shortScoreWord={resolveLanguageKey("passwordTooShort")}
            scoreWords={resolveLanguageValue<string[]>("passwordStages") ?? undefined}
        />
    )
}

export default withLanguage("src/modules/core/components/custom/passwordStrength.tsx")(PasswordStrength)
