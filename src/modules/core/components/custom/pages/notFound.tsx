import { compose } from "redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@coreModule/components/ui/button.tsx";
import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";

type NotFoundProps = WithLanguageType;

function NotFound({ resolveLanguageKey }: NotFoundProps) {
    const navigate = useNavigate();

    return (
        <div className='h-svh'>
            <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
                <h1 className='text-[7rem] leading-tight font-bold'>404</h1>
                <span className='font-medium'>{resolveLanguageKey("title")}</span>
                <p className='text-muted-foreground text-center leading-tight'>
                    <pre>{resolveLanguageKey("description")}</pre>
                </p>
                <div className='mt-6 flex gap-4'>
                    <Button variant='outline' onClick={() => history.go(-1)}>
                        {resolveLanguageKey("backLabel")}
                    </Button>
                    <Button onClick={() => navigate('/')}>
                        {resolveLanguageKey("backHome")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/pages/notFound.tsx"),
)(NotFound);
