import {useNavigate} from "react-router-dom";
import {Button} from "@coreModule/components/ui/button.tsx";

type StatusPageProps = {
    /** HTTP status shown as the headline, e.g. `"403"`. */
    code: string;
    title: string;
    description: string;
    backLabel: string;
    backHomeLabel: string;
};

export function StatusPage({code, title, description, backLabel, backHomeLabel}: StatusPageProps) {
    const navigate = useNavigate();

    return (
        <div className="h-svh">
            <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
                <h1 className="text-[7rem] leading-tight font-bold">
                    {code}
                </h1>
                <span className="font-medium">{title}</span>
                <pre className="text-muted-foreground text-center leading-tight font-sans whitespace-pre-wrap">
                    {description}
                </pre>
                <div className="mt-6 flex gap-4">
                    <Button variant="outline" onClick={() => history.go(-1)}>
                        {backLabel}
                    </Button>
                    <Button onClick={() => navigate("/")}>
                        {backHomeLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default StatusPage;
