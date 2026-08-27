import {ForgotPasswordFormType} from "armonia/src/modules/core/api/user/public/forgotPassword/forgotPassword.form.type.ts";
import {ChangeForgottenPasswordFormType} from "armonia/src/modules/core/api/user/public/forgotPassword/changeForgottenPassword.form.type.ts";
import {AcceptInvitationFormType} from "armonia/src/modules/core/api/user/public/acceptInvitation/acceptInvitation.form.type.ts";
import {SignUpFormType} from "armonia/src/modules/core/api/user/public/signUp/signup.form.type.ts";
import {CreateUserFormType} from "armonia/src/modules/core/api/company/private/users/createUser.form.type.ts";
import {InviteUserFormType} from "armonia/src/modules/core/api/company/private/users/inviteUser.form.type.ts";

export function defaultSignInValues(): any{
    if( process.env.NODE_ENV === "development" ){
        return {
            username: 'echo@echo.com',
            password: 'EchoPronix@10',
            mfaCode: undefined
        }
    }
    return {
        username: '',
        password: '',
        mfaCode: undefined
    }
}

export function defaultForgotPasswordValues(): ForgotPasswordFormType{
    if( process.env.NODE_ENV === "development" ){
        return {
            email: 'echo@echo.com',
        }
    }
    return {
        email: '',
    }
}

export function defaultChangeForgottenPasswordValues(): ChangeForgottenPasswordFormType {
    if( process.env.NODE_ENV === "development" ){
        return {
            password: 'StrongPassword@10',
            confirmPassword: 'StrongPassword@10',
            resetPasswordCode: ""
        }
    }
    return {
        password: "",
        confirmPassword: "",
        resetPasswordCode: ""
    }
}

export function defaultAcceptInvitationValues(): AcceptInvitationFormType {
    if( process.env.NODE_ENV === "development" ){
        return {
            password: "StrongPassword@10",
            invitationCode: ""
        }
    }
    return {
        password: "",
        invitationCode: ""
    }}

export function defaultSignUpValues(): SignUpFormType{
    if( process.env.NODE_ENV === "development" ){
        let dateNow = new Date().getTime();
        return {
            name: `SignUp_Name_${dateNow}`,
            surname: `SignUp_Surname_${dateNow}`,
            email: `${dateNow}@signup.com`,
            password: "StrongPassword@10",
            confirmPassword: "StrongPassword@10"
        }
    }
    return {
        name: "",
        surname: "",
        email: "",
        password: "",
        confirmPassword: ""
    }
}

export function defaultCreateUserValues(): CreateUserFormType {
    if( process.env.NODE_ENV === "development" ){
        let dateNow = new Date().getTime();
        return {
            name: `Name_${dateNow}`,
            surname: `Surname_${dateNow}`,
            email: `${dateNow}@createuser.com`,
            password: "StrongPassword@10",
            confirmPassword: "StrongPassword@10",
            userRole: ""
        }
    }
    return {
        name: "",
        surname: "",
        email: "",
        password: "",
        confirmPassword: "",
        userRole: ""
    }
}

export function defaultInviteUserValues(): InviteUserFormType {
    if( process.env.NODE_ENV === "development" ){
        let dateNow = new Date().getTime();
        return {
            name: `Name_${dateNow}`,
            surname: `Surname_${dateNow}`,
            email: `${dateNow}@createuser.com`,
            welcomeMessage: "Welcome to Armonia!",
            userRole: ""
        }
    }
    return {
        name: "",
        surname: "",
        email: "",
        userRole: "",
        welcomeMessage: ""
    }
}

