/**
 * The one tooltip primitive (D22): the animated animate-ui tooltip. Features import it from here, never from
 * animate-ui. Placement (`side`, `sideOffset`, `container`) goes on `Tooltip`; the provider's delay is `openDelay`.
 */
export {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
    type TooltipContentProps,
    type TooltipProps,
    type TooltipProviderProps,
    type TooltipTriggerProps,
} from "@coreModule/components/animate-ui/components/animate/tooltip.tsx";
export {useTooltipProviderPresent} from "@coreModule/components/animate-ui/primitives/animate/tooltip.tsx";
