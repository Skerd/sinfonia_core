import {Component, ErrorInfo, ReactNode} from "react";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import useSelectedLanguage from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import type {LanguageDictionary} from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
const LANGUAGE_PATH = "src/modules/core/components/custom/errorBoundary.tsx";

type ErrorBoundaryFallbackProps = {
    onRetry: () => void;
    onGoHome: () => void;
    title?: string;
    description?: string;
};

function getTranslation(lang: LanguageDictionary | null, key: string): string | undefined {
    if (!lang || typeof lang !== "object" || !(key in lang)) return undefined;
    const v = (lang as Record<string, unknown>)[key];
    return typeof v === "string" ? v : undefined;
}

function ErrorBoundaryFallback({onRetry, onGoHome, title: titleOverride, description: descriptionOverride}: ErrorBoundaryFallbackProps) {
    const {currentLanguage} = useSelectedLanguage<LanguageDictionary>(
        LANGUAGE_PATH.replace(/\//g, "_"),
        LANGUAGE_PATH
    );

    const title = titleOverride ?? getTranslation(currentLanguage ?? null, "title") ?? "Something went wrong";
    const description = descriptionOverride ?? getTranslation(currentLanguage ?? null, "description") ?? "An unexpected error occurred while rendering this page.";
    const retryLabel = getTranslation(currentLanguage ?? null, "retry") ?? "Retry";
    const goHomeLabel = getTranslation(currentLanguage ?? null, "goHome") ?? "Go home";

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <Button onClick={onRetry}>{retryLabel}</Button>
                    <Button variant="outline" onClick={onGoHome}>{goHomeLabel}</Button>
                </CardContent>
            </Card>
        </div>
    );
}

type ErrorBoundaryProps = {
    children: ReactNode;
    title?: string;
    description?: string;
};

type ErrorBoundaryState = {
    hasError: boolean;
};

/**
 * Error boundary: must remain a class component because React only supports
 * getDerivedStateFromError/componentDidCatch in class components.
 * Fallback UI is a functional component with language support.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        hasError: false
    };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return {hasError: true};
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({hasError: false});
    };

    private handleGoHome = () => {
        if (typeof window !== "undefined") {
            window.location.assign("/");
        }
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <ErrorBoundaryFallback
                onRetry={this.handleRetry}
                onGoHome={this.handleGoHome}
                title={this.props.title}
                description={this.props.description}
            />
        );
    }
}
