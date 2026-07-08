import { Button } from "@coreModule/components/uiKit/ui/button";
import { ButtonGroup } from "@coreModule/components/uiKit/ui/button-group";

export default function ButtonGroupComponent() {
  return (
    <ButtonGroup>
      <Button variant="outline">Days</Button>
      <Button variant="outline">Months</Button>
      <Button variant="outline">Years</Button>
    </ButtonGroup>
  );
}
