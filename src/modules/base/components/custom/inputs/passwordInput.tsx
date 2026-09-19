import React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from "@coreModule/components/lib/utils.ts"
import { Button } from '@coreModule/components/ui/button.tsx'
import { Input } from '@coreModule/components/ui/input.tsx'
import useSelectedLanguage, {
  type LanguageDictionary,
} from "@baseModule/helpers/hooks/useSelectedLanguage.ts"

const LANGUAGE_PATH = "src/modules/core/components/custom/inputs/passwordInput.tsx"

const DEFAULT_TEXT = {
  show: "Show password",
  hide: "Hide password",
} as const

function dictText(lang: LanguageDictionary | null, key: keyof typeof DEFAULT_TEXT): string {
  const value = lang?.[key]
  return typeof value === "string" && value !== "" ? value : DEFAULT_TEXT[key]
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<typeof Input>, 'type'>
>(function PasswordInput({ className, disabled, ...props }, ref) {
  const [showPassword, setShowPassword] = React.useState(false)
  const { currentLanguage } = useSelectedLanguage<LanguageDictionary>(LANGUAGE_PATH)

  const toggleLabel = showPassword
    ? dictText(currentLanguage, "hide")
    : dictText(currentLanguage, "show")

  return (
    <div className={cn('relative', className)}>
      <Input
        type={showPassword ? 'text' : 'password'}
        ref={ref}
        disabled={disabled}
        className="pr-9"
        {...props}
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={disabled}
        // Icon-only: without these the button announces as just "button", with no state.
        aria-label={toggleLabel}
        title={toggleLabel}
        aria-pressed={showPassword}
        aria-controls={props.id}
        className="text-muted-foreground absolute end-1 top-1/2 size-6 -translate-y-1/2 rounded-md"
        // Keeps the caret where the typing left off; the click still fires.
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => setShowPassword((prev) => !prev)}
      >
        {/* The icon names the action, matching the label: an eye means "reveal it". */}
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </Button>
    </div>
  )
})
