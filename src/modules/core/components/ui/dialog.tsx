import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@coreModule/components/lib/utils.ts"
import { Button } from "@coreModule/components/ui/button.tsx"
import { IconX } from "@tabler/icons-react"
import { UiTexts } from "@coreModule/components/ui/ui-texts.tsx"

const LANGUAGE_PATH = "src/modules/core/components/ui/dialog.tsx"
const ENGLISH = { close: "Close" } as const

/** The close button's text in the app language (TD-F85). */
function CloseLabel() {
  return <UiTexts path={LANGUAGE_PATH} english={ENGLISH}>{(text) => text("close")}</UiTexts>
}

const DISMISS_GUARD_MS = 500
let dismissGuardUntil = 0

const OVERLAY_INTERIOR =
  "[data-slot=dialog-content], [data-slot=alert-dialog-content], [data-slot=sheet-content]"

function isOverlayInterior(target: EventTarget | null) {
  return target instanceof Element && !!target.closest(OVERLAY_INTERIOR)
}

/**
 * Swallow the leftover `click` that fires on the element under a closing overlay
 * (dropdown item, dialog dismiss). Without this, table rows treat that click as
 * "view" and open the sheet instead of the action's dialog.
 */
function armDialogDismissGuard() {
  dismissGuardUntil = performance.now() + DISMISS_GUARD_MS
  const swallow = (event: Event) => {
    if (isOverlayInterior(event.target)) return
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    document.removeEventListener("click", swallow, true)
  }
  document.addEventListener("click", swallow, true)
  window.setTimeout(() => {
    document.removeEventListener("click", swallow, true)
  }, DISMISS_GUARD_MS)
}

/** True for a short window after a dialog closes from an outside pointer. */
function isDialogDismissGuarded() {
  return performance.now() < dismissGuardUntil
}

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 animation-duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onPointerDownOutside,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay
        className="cursor-pointer"
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-background p-4 text-sm ring-1 ring-foreground/10 animation-duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          "cursor-default",
          className
        )}
        {...props}
        onPointerDownOutside={(event) => {
          onPointerDownOutside?.(event)
          if (event.defaultPrevented) return
          armDialogDismissGuard()
        }}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            >
              <IconX
              />
              <span className="sr-only"><CloseLabel /></span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

/**
 * A modal that brings its own layout (full-screen panels, drawers, lightboxes, D23). Radix gives the focus trap, focus
 * return, Escape and scroll lock; nothing is styled. `overlayClassName` styles the backdrop, which also positions the
 * content (a click on it closes the modal); `className` styles the content. `title` is the accessible name, read by
 * screen readers only. The standard card is `DialogContent`.
 */
function DialogFrame({
  title,
  className,
  overlayClassName,
  children,
  onPointerDownOutside,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Content>, "title"> & {
  title: string
  overlayClassName?: string
}) {
  // Radix returns focus only to a DialogTrigger; these modals open from their own buttons, so remember the opener.
  const openerRef = React.useRef<HTMLElement | null>(null)
  return (
    <DialogPortal>
      <DialogPrimitive.Overlay data-slot="dialog-overlay" className={overlayClassName}>
        <DialogPrimitive.Content
          data-slot="dialog-content"
          aria-describedby={undefined}
          className={cn("outline-none", className)}
          {...props}
          onOpenAutoFocus={(event) => {
            openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
            onOpenAutoFocus?.(event)
          }}
          onCloseAutoFocus={(event) => {
            onCloseAutoFocus?.(event)
            if (event.defaultPrevented) return
            event.preventDefault()
            openerRef.current?.focus()
          }}
          onPointerDownOutside={(event) => {
            onPointerDownOutside?.(event)
            if (event.defaultPrevented) return
            armDialogDismissGuard()
          }}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Overlay>
    </DialogPortal>
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline"><CloseLabel /></Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base leading-none font-medium", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  armDialogDismissGuard,
  isDialogDismissGuarded,
}
