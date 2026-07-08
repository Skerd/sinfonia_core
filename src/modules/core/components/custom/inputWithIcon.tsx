import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@coreModule/components/ui/input-group.tsx";
import { InputHTMLAttributes, ReactNode } from "react";

export function InputWithIcon({
  icon,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  icon: ReactNode;
}) {
  return (
    <InputGroup>
      <InputGroupAddon align="inline-start">{icon}</InputGroupAddon>
      <InputGroupInput className={className} {...props} />
    </InputGroup>
  );
}
