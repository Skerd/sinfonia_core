import { Button } from "@coreModule/components/uiKit/ui/button";
import { ButtonGroup } from "@coreModule/components/uiKit/ui/button-group";
import { InputGroup, InputGroupInput } from "@coreModule/components/uiKit/ui/input-group";

export default function ButtonGroupComponent() {
  return (
    <ButtonGroup>
      <ButtonGroup>
        <InputGroup>
          <InputGroupInput placeholder="Email address" />
        </InputGroup>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Add</Button>
      </ButtonGroup>
    </ButtonGroup>
  );
}
