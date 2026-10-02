'use client';

import * as React from 'react';
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  type Transition,
  type HTMLMotionProps,
} from 'motion/react';
import {
  useFloating,
  autoUpdate,
  offset as floatingOffset,
  flip,
  shift,
  arrow as floatingArrow,
  FloatingPortal,
  FloatingArrow,
  type UseFloatingReturn,
} from '@floating-ui/react';

import { getStrictContext } from '@coreModule/components/animate-ui/lib/get-strict-context.tsx';
import { Slot, type WithAsChild } from '@coreModule/components/animate-ui/primitives/animate/slot';

type Side = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

type TooltipData = {
  contentProps: HTMLMotionProps<'div'>;
  contentAsChild: boolean;
  rect: DOMRect;
  side: Side;
  sideOffset: number;
  align: Align;
  alignOffset: number;
  id: string;
  root: HTMLElement | null;
};

type GlobalTooltipContextType = {
  showTooltip: (data: TooltipData) => void;
  hideTooltip: () => void;
  hideImmediate: () => void;
  notifyContentEnter: () => void;
  notifyContentLeave: () => void;
  setFloatingEl: (el: HTMLElement | null) => void;
  currentTooltip: TooltipData | null;
  transition: Transition;
  globalId: string;
  setReferenceEl: (el: HTMLElement | null) => void;
  referenceElRef: React.RefObject<HTMLElement | null>;
};

const [GlobalTooltipProvider, useGlobalTooltip] =
  getStrictContext<GlobalTooltipContextType>('GlobalTooltipProvider');

type TooltipContextType = {
  props: HTMLMotionProps<'div'>;
  setProps: React.Dispatch<React.SetStateAction<HTMLMotionProps<'div'>>>;
  asChild: boolean;
  setAsChild: React.Dispatch<React.SetStateAction<boolean>>;
  side: Side;
  sideOffset: number;
  align: Align;
  alignOffset: number;
  id: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  container: HTMLElement | null;
};

const [LocalTooltipProvider, useTooltip] = getStrictContext<TooltipContextType>(
  'LocalTooltipProvider',
);

const TooltipProviderPresenceContext = React.createContext(false);

function useTooltipProviderPresent() {
  return React.useContext(TooltipProviderPresenceContext);
}

type TooltipPosition = { x: number; y: number };

function getResolvedSide(placement: Side | `${Side}-${Align}`) {
  if (placement.includes('-')) {
    return placement.split('-')[0] as Side;
  }
  return placement as Side;
}

function initialFromSide(side: Side): Partial<Record<'x' | 'y', number>> {
  if (side === 'top') return { y: 15 };
  if (side === 'bottom') return { y: -15 };
  if (side === 'left') return { x: 15 };
  return { x: -15 };
}

function isSameOpenTooltip(active: TooltipData, next: TooltipData) {
  return (
    active.id === next.id &&
    active.contentProps === next.contentProps &&
    active.contentAsChild === next.contentAsChild &&
    active.side === next.side &&
    active.sideOffset === next.sideOffset &&
    active.align === next.align &&
    active.alignOffset === next.alignOffset &&
    active.root === next.root
  );
}

type TooltipProviderProps = {
  children: React.ReactNode;
  id?: string;
  openDelay?: number;
  closeDelay?: number;
  transition?: Transition;
};

function TooltipProvider({
  children,
  id,
  openDelay = 700,
  closeDelay = 300,
  transition = { type: 'spring', stiffness: 300, damping: 35 },
}: TooltipProviderProps) {
  const globalId = React.useId();
  const [currentTooltip, setCurrentTooltip] =
    React.useState<TooltipData | null>(null);
  const currentTooltipRef = React.useRef<TooltipData | null>(currentTooltip);
  currentTooltipRef.current = currentTooltip;
  const timeoutRef = React.useRef<number | null>(null);
  const lastCloseTimeRef = React.useRef<number>(0);
  const referenceElRef = React.useRef<HTMLElement | null>(null);
  const contentHoverRef = React.useRef(false);
  const floatingElRef = React.useRef<HTMLElement | null>(null);

  const showTooltip = React.useCallback(
    (data: TooltipData) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const active = currentTooltipRef.current;
      if (active !== null) {
        if (isSameOpenTooltip(active, data)) return;
        currentTooltipRef.current = data;
        setCurrentTooltip(data);
        return;
      }
      const now = Date.now();
      const delay = now - lastCloseTimeRef.current < closeDelay ? 0 : openDelay;
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        currentTooltipRef.current = data;
        setCurrentTooltip(data);
      }, delay);
    },
    [openDelay, closeDelay],
  );

  const hideTooltip = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      if (contentHoverRef.current) return;
      currentTooltipRef.current = null;
      setCurrentTooltip(null);
      lastCloseTimeRef.current = Date.now();
    }, closeDelay);
  }, [closeDelay]);

  const hideImmediate = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    contentHoverRef.current = false;
    currentTooltipRef.current = null;
    setCurrentTooltip(null);
    lastCloseTimeRef.current = Date.now();
  }, []);

  const notifyContentEnter = React.useCallback(() => {
    contentHoverRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const notifyContentLeave = React.useCallback(() => {
    contentHoverRef.current = false;
    hideTooltip();
  }, [hideTooltip]);

  const setReferenceEl = React.useCallback((el: HTMLElement | null) => {
    referenceElRef.current = el;
  }, []);

  const setFloatingEl = React.useCallback((el: HTMLElement | null) => {
    floatingElRef.current = el;
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideImmediate();
    };
    const onScroll = (event: Event) => {
      if (contentHoverRef.current) return;
      const floating = floatingElRef.current;
      if (floating) {
        if (event.target instanceof Node && floating.contains(event.target)) return;
        if (event.composedPath().includes(floating)) return;
      }
      hideImmediate();
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', hideImmediate, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', hideImmediate, true);
    };
  }, [hideImmediate]);

  return (
    <TooltipProviderPresenceContext.Provider value={true}>
      <GlobalTooltipProvider
        value={{
          showTooltip,
          hideTooltip,
          hideImmediate,
          notifyContentEnter,
          notifyContentLeave,
          setFloatingEl,
          currentTooltip,
          transition,
          globalId: id ?? globalId,
          setReferenceEl,
          referenceElRef,
        }}
      >
        <LayoutGroup>{children}</LayoutGroup>
        <TooltipOverlay />
      </GlobalTooltipProvider>
    </TooltipProviderPresenceContext.Provider>
  );
}

type RenderedTooltipContextType = {
  side: Side;
  align: Align;
  open: boolean;
};

const [RenderedTooltipProvider, useRenderedTooltip] =
  getStrictContext<RenderedTooltipContextType>('RenderedTooltipContext');

type FloatingContextType = {
  context: UseFloatingReturn['context'];
  arrowRef: React.RefObject<SVGSVGElement | null>;
};

const [FloatingProvider, useFloatingContext] =
  getStrictContext<FloatingContextType>('FloatingContext');

const MotionTooltipArrow = motion.create(FloatingArrow);

type TooltipArrowProps = Omit<
  React.ComponentProps<typeof MotionTooltipArrow>,
  'context'
> & {
  withTransition?: boolean;
};

function TooltipArrow({
  ref,
  withTransition = true,
  ...props
}: TooltipArrowProps) {
  const { side, align, open } = useRenderedTooltip();
  const { context, arrowRef } = useFloatingContext();
  const { transition, globalId } = useGlobalTooltip();
  React.useImperativeHandle(ref, () => arrowRef.current as SVGSVGElement);

  const deg = { top: 0, right: 90, bottom: 180, left: -90 }[side];

  return (
    <MotionTooltipArrow
      ref={arrowRef}
      context={context}
      data-state={open ? 'open' : 'closed'}
      data-side={side}
      data-align={align}
      data-slot="tooltip-arrow"
      style={{ rotate: deg }}
      layoutId={withTransition ? `tooltip-arrow-${globalId}` : undefined}
      transition={withTransition ? transition : undefined}
      {...props}
    />
  );
}

type TooltipPortalProps = React.ComponentProps<typeof FloatingPortal>;

function TooltipPortal(props: TooltipPortalProps) {
  return <FloatingPortal {...props} />;
}

function TooltipOverlay() {
  const {
    currentTooltip,
    transition,
    globalId,
    referenceElRef,
    notifyContentEnter,
    notifyContentLeave,
    setFloatingEl,
  } = useGlobalTooltip();

  const [rendered, setRendered] = React.useState<{
    data: TooltipData | null;
    open: boolean;
  }>({ data: null, open: false });

  const arrowRef = React.useRef<SVGSVGElement | null>(null);

  const side = rendered.data?.side ?? 'top';
  const align = rendered.data?.align ?? 'center';

  const { refs, x, y, strategy, context, update } = useFloating({
    placement: align === 'center' ? side : `${side}-${align}`,
    whileElementsMounted: autoUpdate,
    middleware: [
      floatingOffset({
        mainAxis: rendered.data?.sideOffset ?? 0,
        crossAxis: rendered.data?.alignOffset ?? 0,
      }),
      flip(),
      shift({ padding: 8 }),
      floatingArrow({ element: arrowRef }),
    ],
  });

  React.useEffect(() => {
    if (currentTooltip) {
      setRendered({ data: currentTooltip, open: true });
    } else {
      setRendered((p) => (p.data ? { ...p, open: false } : p));
    }
  }, [currentTooltip]);

  React.useLayoutEffect(() => {
    if (referenceElRef.current) {
      refs.setReference(referenceElRef.current);
      update();
    }
  }, [referenceElRef, refs, update, rendered.data]);

  const ready = x != null && y != null;
  const Component = rendered.data?.contentAsChild ? Slot : motion.div;
  const resolvedSide = getResolvedSide(context.placement);

  // React 19 calls a replaced callback ref with null. setFloating writes that
  // into state, so an inline ref here re-renders forever.
  const setFloatingNode = React.useCallback(
    (node: HTMLDivElement | null) => {
      refs.setFloating(node);
      setFloatingEl(node);
    },
    [refs.setFloating, setFloatingEl],
  );

  return (
    <AnimatePresence mode="wait">
      {rendered.data && ready && (
        <TooltipPortal root={rendered.data.root ?? undefined}>
          <div
            ref={setFloatingNode}
            onPointerEnter={notifyContentEnter}
            onPointerLeave={notifyContentLeave}
            data-slot="tooltip-overlay"
            data-side={resolvedSide}
            data-align={rendered.data.align}
            data-state={rendered.open ? 'open' : 'closed'}
            style={{
              position: strategy,
              top: 0,
              left: 0,
              zIndex: 50,
              transform: `translate3d(${x!}px, ${y!}px, 0)`,
            }}
          >
            <FloatingProvider value={{ context, arrowRef }}>
              <RenderedTooltipProvider
                value={{
                  side: resolvedSide,
                  align: rendered.data.align,
                  open: rendered.open,
                }}
              >
                <Component
                  data-slot="tooltip-content"
                  data-side={resolvedSide}
                  data-align={rendered.data.align}
                  data-state={rendered.open ? 'open' : 'closed'}
                  layoutId={`tooltip-content-${globalId}`}
                  initial={{
                    opacity: 0,
                    scale: 0,
                    ...initialFromSide(rendered.data.side),
                  }}
                  animate={
                    rendered.open
                      ? { opacity: 1, scale: 1, x: 0, y: 0 }
                      : {
                          opacity: 0,
                          scale: 0,
                          ...initialFromSide(rendered.data.side),
                        }
                  }
                  exit={{
                    opacity: 0,
                    scale: 0,
                    ...initialFromSide(rendered.data.side),
                  }}
                  onAnimationComplete={() => {
                    if (!rendered.open)
                      setRendered({ data: null, open: false });
                  }}
                  transition={transition}
                  {...rendered.data.contentProps}
                  style={{
                    position: 'relative',
                    ...(rendered.data.contentProps?.style || {}),
                  }}
                />
              </RenderedTooltipProvider>
            </FloatingProvider>
          </div>
        </TooltipPortal>
      )}
    </AnimatePresence>
  );
}

type TooltipProps = {
  children: React.ReactNode;
  side?: Side;
  sideOffset?: number;
  align?: Align;
  alignOffset?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  container?: HTMLElement | null;
};

function Tooltip({
  children,
  side = 'top',
  sideOffset = 0,
  align = 'center',
  alignOffset = 0,
  open,
  onOpenChange,
  container = null,
}: TooltipProps) {
  const id = React.useId();
  const [props, setProps] = React.useState<HTMLMotionProps<'div'>>({});
  const [asChild, setAsChild] = React.useState(false);

  return (
    <LocalTooltipProvider
      value={{
        props,
        setProps,
        asChild,
        setAsChild,
        side,
        sideOffset,
        align,
        alignOffset,
        id,
        open,
        onOpenChange,
        container,
      }}
    >
      {children}
    </LocalTooltipProvider>
  );
}

type TooltipContentProps = WithAsChild<HTMLMotionProps<'div'>>;

function shallowEqualWithoutChildren(
  a?: HTMLMotionProps<'div'>,
  b?: HTMLMotionProps<'div'>,
) {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a).filter((k) => k !== 'children');
  const keysB = Object.keys(b).filter((k) => k !== 'children');
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    // @ts-expect-error index
    if (a[k] !== b[k]) return false;
  }
  return true;
}

function TooltipContent({ asChild = false, ...props }: TooltipContentProps) {
  const { setProps, setAsChild } = useTooltip();
  const lastPropsRef = React.useRef<HTMLMotionProps<'div'> | undefined>(
    undefined,
  );

  React.useEffect(() => {
    if (!shallowEqualWithoutChildren(lastPropsRef.current, props)) {
      lastPropsRef.current = props;
      setProps(props);
    }
  }, [props, setProps]);

  React.useEffect(() => {
    setAsChild(asChild);
  }, [asChild, setAsChild]);

  return null;
}

type TooltipTriggerProps = WithAsChild<HTMLMotionProps<'div'>>;

function TooltipTrigger({
  ref,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onPointerDown,
  asChild = false,
  ...props
}: TooltipTriggerProps) {
  const {
    props: contentProps,
    asChild: contentAsChild,
    side,
    sideOffset,
    align,
    alignOffset,
    id,
    open,
    onOpenChange,
    container,
  } = useTooltip();
  const {
    showTooltip,
    hideTooltip,
    hideImmediate,
    currentTooltip,
    setReferenceEl,
  } = useGlobalTooltip();

  const isControlled = open !== undefined;
  const triggerRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => triggerRef.current as HTMLDivElement);

  const suppressNextFocusRef = React.useRef(false);
  const currentTooltipIdRef = React.useRef(currentTooltip?.id);
  currentTooltipIdRef.current = currentTooltip?.id;

  const handleOpen = React.useCallback(() => {
    if (!triggerRef.current) return;
    setReferenceEl(triggerRef.current);
    const rect = triggerRef.current.getBoundingClientRect();
    showTooltip({
      contentProps,
      contentAsChild,
      rect,
      side,
      sideOffset,
      align,
      alignOffset,
      id,
      root: container,
    });
  }, [
    showTooltip,
    setReferenceEl,
    contentProps,
    contentAsChild,
    side,
    sideOffset,
    align,
    alignOffset,
    id,
    container,
  ]);

  React.useEffect(() => {
    if (!isControlled) return;
    if (open) {
      handleOpen();
      return;
    }
    if (currentTooltip?.id === id) hideImmediate();
  }, [isControlled, open, handleOpen, currentTooltip?.id, id, hideImmediate]);

  React.useEffect(() => {
    return () => {
      if (currentTooltipIdRef.current === id) hideImmediate();
    };
  }, [id, hideImmediate]);

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(e);
      if (isControlled) return;
      if (currentTooltip?.id === id) {
        suppressNextFocusRef.current = true;
        hideImmediate();
        Promise.resolve().then(() => {
          suppressNextFocusRef.current = false;
        });
      }
    },
    [onPointerDown, isControlled, currentTooltip?.id, id, hideImmediate],
  );

  const handleMouseEnter = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseEnter?.(e);
      if (isControlled) {
        onOpenChange?.(true);
        if (open) handleOpen();
        return;
      }
      handleOpen();
      onOpenChange?.(true);
    },
    [handleOpen, isControlled, onMouseEnter, onOpenChange, open],
  );

  const handleMouseLeave = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseLeave?.(e);
      if (isControlled) {
        onOpenChange?.(false);
        return;
      }
      hideTooltip();
      onOpenChange?.(false);
    },
    [hideTooltip, isControlled, onMouseLeave, onOpenChange],
  );

  const handleFocus = React.useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      onFocus?.(e);
      if (suppressNextFocusRef.current) return;
      if (isControlled) {
        onOpenChange?.(true);
        if (open) handleOpen();
        return;
      }
      handleOpen();
      onOpenChange?.(true);
    },
    [handleOpen, isControlled, onFocus, onOpenChange, open],
  );

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      onBlur?.(e);
      if (isControlled) {
        onOpenChange?.(false);
        return;
      }
      hideTooltip();
      onOpenChange?.(false);
    },
    [hideTooltip, isControlled, onBlur, onOpenChange],
  );

  const Component = asChild ? Slot : motion.div;

  return (
    <Component
      ref={triggerRef}
      onPointerDown={handlePointerDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-slot="tooltip-trigger"
      data-side={side}
      data-align={align}
      data-state={currentTooltip?.id === id ? 'open' : 'closed'}
      {...props}
    />
  );
}

export {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipArrow,
  useGlobalTooltip,
  useTooltip,
  useTooltipProviderPresent,
  type TooltipProviderProps,
  type TooltipProps,
  type TooltipContentProps,
  type TooltipTriggerProps,
  type TooltipArrowProps,
  type TooltipPosition,
  type GlobalTooltipContextType,
  type TooltipContextType,
};
