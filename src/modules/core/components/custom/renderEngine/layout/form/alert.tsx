import { IconInfoCircle } from "@tabler/icons-react";
import { Alert, AlertDescription } from "@coreModule/components/ui/alert.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";

type FormAlertProps = {
    /** Resolved display text (language key resolved in ViewRenderer). */
    message: string;
    variant?: "default" | "warning";
    className?: string;
};

export function FormAlert({ message, variant = "default", className }: FormAlertProps) {
    return (
        <Alert variant={variant} className={cn(className)}>
            <IconInfoCircle />
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    );
}
