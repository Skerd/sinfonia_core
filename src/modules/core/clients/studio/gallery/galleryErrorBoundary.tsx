import {Component, type ErrorInfo, type ReactNode} from "react";

type GalleryErrorBoundaryProps = {
    token: string;
    children: ReactNode;
};

type GalleryErrorBoundaryState = {
    error: Error | null;
};

/**
 * Per-widget boundary so one overlay or compound field cannot take the gallery down.
 *
 * The panel `ErrorBoundary` is a full-page retry card — too loud for a tile.
 */
export default class GalleryErrorBoundary extends Component<
    GalleryErrorBoundaryProps,
    GalleryErrorBoundaryState
> {
    state: GalleryErrorBoundaryState = {error: null};

    static getDerivedStateFromError(error: Error): GalleryErrorBoundaryState {
        return {error};
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error(`[studio gallery] ${this.props.token} failed`, error, errorInfo);
    }

    componentDidUpdate(prevProps: GalleryErrorBoundaryProps) {
        if (this.state.error && prevProps.token !== this.props.token) {
            this.setState({error: null});
        }
    }

    render() {
        if (this.state.error) {
            return (
                <div className="flex flex-col items-start gap-2">
                    <p className="text-2xs text-destructive">
                        {this.props.token} failed to render ({this.state.error.message}).
                    </p>
                    <button
                        type="button"
                        className="text-2xs text-muted-foreground underline"
                        onClick={() => this.setState({error: null})}
                    >
                        Retry
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
