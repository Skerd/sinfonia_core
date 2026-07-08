import withLanguage from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {ErrorView} from "./errorView.tsx";

export default compose(
    withLanguage("src/modules/core/components/custom/errorViewWrapper.tsx")
)(ErrorView)