/**
 * Public form-widget surface of the view engine (used by the repeaters and the Studio).
 * Implementations live under `form/`.
 */
export type {FormWidgetExtra} from "./form/types.ts";
export {renderFormWidget} from "./form/widgets/scalar.tsx";
export {renderCompoundWidget} from "./form/widgets/compound.tsx";
export {isCompoundFormWidget} from "./widgetRegistry.ts";
