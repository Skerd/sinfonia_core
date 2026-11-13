import * as React from "react"

import { cn } from "@coreModule/components/lib/utils"
import { Button } from "@coreModule/components/ui/button"
import { IconChevronLeft, IconChevronRight, IconDots } from "@tabler/icons-react"
import { UiTexts } from "@coreModule/components/ui/ui-texts.tsx"

const LANGUAGE_PATH = "src/modules/core/components/ui/pagination.tsx"
const ENGLISH = {
  pagination: "Pagination",
  previous: "Previous",
  next: "Next",
  previousPage: "Go to the previous page",
  nextPage: "Go to the next page",
  morePages: "More pages",
} as const

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <UiTexts path={LANGUAGE_PATH} english={ENGLISH}>
      {(text) => (
        <nav
          role="navigation"
          aria-label={text("pagination")}
          data-slot="pagination"
          className={cn("mx-auto flex w-full justify-center", className)}
          {...props}
        />
      )}
    </UiTexts>
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  children,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      asChild
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(className)}
    >
      <a
        aria-current={isActive ? "page" : undefined}
        data-slot="pagination-link"
        data-active={isActive}
        {...props}
      >
        {children}
      </a>
    </Button>
  )
}

function PaginationPrevious({
  className,
  text,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <UiTexts path={LANGUAGE_PATH} english={ENGLISH}>
      {(uiText) => (
        <PaginationLink
          aria-label={uiText("previousPage")}
          size="default"
          className={cn("pl-1.5!", className)}
          {...props}
        >
          <IconChevronLeft data-icon="inline-start" />
          <span className="hidden sm:block">{text ?? uiText("previous")}</span>
        </PaginationLink>
      )}
    </UiTexts>
  )
}

function PaginationNext({
  className,
  text,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <UiTexts path={LANGUAGE_PATH} english={ENGLISH}>
      {(uiText) => (
        <PaginationLink
          aria-label={uiText("nextPage")}
          size="default"
          className={cn("pr-1.5!", className)}
          {...props}
        >
          <span className="hidden sm:block">{text ?? uiText("next")}</span>
          <IconChevronRight data-icon="inline-end" />
        </PaginationLink>
      )}
    </UiTexts>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <IconDots
      />
      <span className="sr-only"><UiTexts path={LANGUAGE_PATH} english={ENGLISH}>{(text) => text("morePages")}</UiTexts></span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
