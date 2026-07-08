import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

/**
 * Conditionally replaces the wrapped component with `HiddenElement`.
 *
 * When `hideCondition` is truthy in incoming props, this HOC renders
 * `HiddenElement` and passes `hiddenRender` as its `Render` prop.
 * Otherwise it renders the wrapped component and injects `withHidden={true}`.
 *
 * @param hiddenRender Optional renderer passed to `HiddenElement` for custom hidden content.
 */
const withHidden = (hiddenRender?: any) => (WrappedComponent: any) => {

    /**
     * Wrapper that reads `hideCondition` from props to decide which view to render.
     */
    function EnhancedComponent_WithHidden(props: any) {
        if (props["hideCondition"]) {
            return <HiddenElement Render={hiddenRender}/>
        }
        return (
            <WrappedComponent {...props} withHidden={true}/>
        )
    }

    return EnhancedComponent_WithHidden;
}

export default withHidden;
