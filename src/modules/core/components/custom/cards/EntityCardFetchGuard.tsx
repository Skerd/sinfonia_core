import type {ReactNode} from "react";
import Loader from "@coreModule/components/custom/loader.tsx";
import {ErrorView} from "@coreModule/components/custom/errorView.tsx";

type EntityCardFetchGuardProps = {
    fetchId?: string;
    loading?: boolean;
    error?: unknown;
    failedTitle: string;
    failedDescription: string;
    onRetry: () => void;
    children: ReactNode;
};

/** Standard loading/error shell for cards that lazy-fetch via fetchId + withAxios. */
export function EntityCardFetchGuard({
    fetchId,
    loading,
    error,
    failedTitle,
    failedDescription,
    onRetry,
    children,
}: EntityCardFetchGuardProps) {
    if (fetchId && loading) return <Loader />;
    if (fetchId && error) {
        return (
            <ErrorView
                title={failedTitle}
                description={failedDescription}
                onClick={onRetry}
            />
        );
    }
    return <>{children}</>;
}
