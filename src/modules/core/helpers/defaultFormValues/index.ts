import {ForgotPasswordFormType} from "armonia/src/modules/core/api/user/public/forgotPassword/forgotPassword.form.type.ts";
import {ChangeForgottenPasswordFormType} from "armonia/src/modules/core/api/user/public/forgotPassword/changeForgottenPassword.form.type.ts";
import {AcceptInvitationFormType} from "armonia/src/modules/core/api/user/public/acceptInvitation/acceptInvitation.form.type.ts";
import {SignUpFormType} from "armonia/src/modules/core/api/user/public/signUp/signup.form.type.ts";
import {CreateUserFormType} from "armonia/src/modules/core/api/company/private/users/createUser.form.type.ts";
import {InviteUserFormType} from "armonia/src/modules/core/api/company/private/users/inviteUser.form.type.ts";
import {CreateCompanyFormType} from "armonia/src/modules/core/api/company/private/company/company.schema-def.ts";

export function defaultSignInValues(): any{
    if( process.env.NODE_ENV === "development" ){
        return {
            username: 'echo@echo.com',
            password: 'echo',
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

export function defaultCreateCompanyValues(): Omit<CreateCompanyFormType, "allowedDomains"> & {allowedDomains: string} {

    return process.env.NODE_ENV == "development" ?
        {
            name: `Company ${Math.floor(Math.random() * 1000000)}`,
            email: `info@company${Math.floor(Math.random() * 1000000)}.com`,
            phoneNumber: `+35568${Math.floor(100000 + Math.random() * 900000)}`,
            website: `https://company${Math.floor(Math.random() * 1000000)}.com`,
            vat: `AL${Math.floor(10000000 + Math.random() * 90000000)}`,
            description: `This is a random generated description.`,
            allowedDomains: `company${Math.floor(Math.random() * 1000000)}.com`,
            addresses: [
                {
                    "street": "",
                    "postalCode": "",
                    "city": "",
                    "state": "",
                    "country": "",
                    "latitude": 41.3275,
                    "longitude": 19.8189
                }
            ]
        }
        :
        {
            name: "",
            email: "",
            phoneNumber: "",
            website: "",
            vat: "",
            description: "",
            allowedDomains: "",
            addresses: []
        };
}


