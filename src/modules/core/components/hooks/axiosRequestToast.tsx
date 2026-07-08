import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import JsonView from "@uiw/react-json-view";

type AxiosRequestToastProps = WithLanguageType & {
    url: string,
    headers: Record<string, string>,
    response: unknown,
    requestData?: unknown,
    isError?: boolean,
    httpRequest: string
}

export function AxiosRequestToast({
    url,
    headers,
    response,
    requestData,
    isError = false,
    httpRequest,
    resolveLanguageKey
}: AxiosRequestToastProps){
    return (
        <div className="min-w-xs max-w-xs overflow-auto min-h-[20vh] max-h-[20vh]">
            <div className="flex items-center space-x-1">
                <p className="uppercase font-semibold">[{httpRequest}]</p>
                {
                    isError ?
                    <p className="text-destructive uppercase font-semibold">[{resolveLanguageKey("error")}]</p>
                    :
                    <p className="text-green-600 uppercase font-semibold">[{resolveLanguageKey("success")}]</p>
                }
                <p>
                    {resolveLanguageKey("requestInfo")}:
                </p>
            </div>
            <JsonView
                value={{
                    url: url,
                    headers: headers ?? {},
                    requestData: requestData ?? {},
                    response: response ?? {}
                }}
                collapsed={1}
            />
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/components/hooks/axiosRequestToast.tsx")
)(AxiosRequestToast);


