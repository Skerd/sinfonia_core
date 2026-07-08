import { Field, FieldLabel } from "@coreModule/components/uiKit/ui/field";
import { Switch } from "@coreModule/components/uiKit/ui/switch";

export default function FieldComponent() {
  return (
    <Field orientation="horizontal" className="w-fit">
      <FieldLabel htmlFor="2fa">Multi-factor authentication</FieldLabel>
      <Switch id="2fa" />
    </Field>
  );
}
