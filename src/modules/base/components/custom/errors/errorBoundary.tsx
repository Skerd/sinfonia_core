import {Component, ErrorInfo, ReactNode} from "react";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import useSelectedLanguage from "@baseModule/helpers/hooks/useSelectedLanguage.ts";
import type {LanguageDictionary} from "@baseModule/helpers/hooks/useSelectedLanguage.ts";
import {resolveTranslationKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {handleError} from "@baseModule/helpers/general/errors.ts";
const LANGUAGE_PATH = "src/modules/core/components/custom/errors/errorBoundary.tsx";

type ErrorBoundaryFallbackProps = {
    onRetry: () => void;
    onGoHome: () => void;
    title?: string;
    description?: string;
};

function getTranslation(lang: LanguageDictionary | null, key: string): string | undefined {
    const value = resolveTranslationKey(lang, key, true);
    return typeof value === "string" ? value : undefined;
}

function ErrorBoundaryFallback({onRetry, onGoHome, title: titleOverride, description: descriptionOverride}: ErrorBoundaryFallbackProps) {
    const {currentLanguage} = useSelectedLanguage<LanguageDictionary>(LANGUAGE_PATH);

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
    /**
     * Clears the caught error whenever this value changes (e.g. pass a route path so navigating
     * away from a broken page recovers automatically). Compared by `!==`, so `resetKey` should
     * change if it's a new object/array each render.
     */
    resetKey?: unknown;
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
        handleError(error, {context: "ErrorBoundary", ignoreAbort: false, details: {componentStack: errorInfo.componentStack}});
    }

    // `children` is intentionally NOT the reset signal: JSX gives it a new reference on nearly
    // every parent re-render (e.g. an unrelated useIsMobile() state change), so comparing it would
    // clear `hasError` almost immediately after it's set, re-rendering the same broken subtree and
    // re-triggering componentDidCatch in a loop. `resetKey` is the only opt-in reset path.
    componentDidUpdate(prevProps: ErrorBoundaryProps) {
        if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
            this.setState({hasError: false});
        }
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
