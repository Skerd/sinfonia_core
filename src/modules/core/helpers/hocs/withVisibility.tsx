import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

export type VisibilityProps = {
    show?: boolean;
}

const withVisibility = (hiddenRender?: any) => (WrappedComponent: any) => {

    /**
     * Wrapper that reads `hideCondition` from props to decide which view to render.
     */
    function EnhancedComponent_WithVisibility(props: any) {
        if (props["show"] === false) {
            return <HiddenElement Render={hiddenRender}/>
        }
        return (
            <WrappedComponent {...props} withHidden={true}/>
        )
    }

    return EnhancedComponent_WithVisibility;
}

export default withVisibility;
