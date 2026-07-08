import React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from "@coreModule/components/lib/utils.ts"
import { Button } from '@coreModule/components/ui/button.tsx'
import { Input } from '@coreModule/components/ui/input.tsx'

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<typeof Input>, 'type'>
>(function PasswordInput({ className, disabled, ...props }, ref) {
  const [showPassword, setShowPassword] = React.useState(false)

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
        className="text-muted-foreground absolute end-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-md"
        onClick={() => setShowPassword((prev) => !prev)}
      >
        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
      </Button>
    </div>
  )
})
