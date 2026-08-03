import { Toaster as Sonner, type ToasterProps } from "sonner"
import { IconCircleCheck, IconInfoCircle, IconAlertTriangle, IconAlertOctagon, IconLoader } from "@tabler/icons-react"
import { useThemeOptional } from "@coreModule/helpers/context/providers/theme-provider.tsx"

const Toaster = ({ ...props }: ToasterProps) => {
  // Reads the app's own cookie-backed provider rather than next-themes, which is
  // never mounted. `resolvedTheme` is used over `theme` so "system" is settled
  // by the same logic that sets the root class, keeping toasts in step with it.
  const themeContext = useThemeOptional()
  const theme: ToasterProps["theme"] = themeContext?.resolvedTheme ?? "system"

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: (
          <IconCircleCheck className="size-4" />
        ),
        info: (
          <IconInfoCircle className="size-4" />
        ),
        warning: (
          <IconAlertTriangle className="size-4" />
        ),
        error: (
          <IconAlertOctagon className="size-4" />
        ),
        loading: (
          <IconLoader className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
