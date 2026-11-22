import * as React from "react"

type AutoFocusHandler = (event: Event) => void

/**
 * Focus handlers for a Radix dialog-like Content (Dialog, AlertDialog, Sheet). Radix gives focus back only to a
 * Trigger, and most panel dialogs open from their own button, so closing would leave focus on the page body. These
 * remember what was focused when the content opened and focus it again on close (TD-F139, TD-F140). A caller that
 * places focus itself (`preventDefault` in its own `onCloseAutoFocus`) keeps that, and an opener that is gone (a menu
 * item) leaves Radix its own return.
 */
export function useReturnFocusToOpener(onOpenAutoFocus?: AutoFocusHandler, onCloseAutoFocus?: AutoFocusHandler) {
  const openerRef = React.useRef<HTMLElement | null>(null)
  return {
    onOpenAutoFocus: (event: Event) => {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      onOpenAutoFocus?.(event)
    },
    onCloseAutoFocus: (event: Event) => {
      onCloseAutoFocus?.(event)
      const opener = openerRef.current
      if (event.defaultPrevented || !opener?.isConnected) return
      event.preventDefault()
      opener.focus()
    },
  }
}
