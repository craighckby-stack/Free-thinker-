/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-137 [2026-09-20T05:58:23.869Z] */

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// ----------------------------------------------------------------------------
// Primitives Export & Viewport Configuration
// ----------------------------------------------------------------------------

export const ToastProvider = ToastPrimitives.Provider

const VIEWPORT_STYLES = cn(
  "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4",
  "sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
)

export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => {
  const computedClassName = React.useMemo(
    () => cn(VIEWPORT_STYLES, className),
    [className]
  )

  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={computedClassName}
      {...props}
    />
  )
})
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

// ----------------------------------------------------------------------------
// Toast Component & Variants
// ----------------------------------------------------------------------------

const TOAST_BASE_STYLES = cn(
  "group pointer-events-auto relative flex w-full items-center justify-between",
  "space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all",
  "data-[swipe=cancel]:translate-x-0",
  "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
  "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
  "data-[swipe=move]:transition-none",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[swipe=end]:animate-out data-[state=closed]:fade-out-80",
  "data-[state=closed]:slide-out-to-right-full",
  "data-[state=open]:slide-in-from-top-full",
  "data-[state=open]:sm:slide-in-from-bottom-full"
)

export const toastVariants = cva(TOAST_BASE_STYLES, {
  variants: {
    variant: {
      default: "border bg-background text-foreground",
      destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  const computedClassName = React.useMemo(
    () => cn(toastVariants({ variant }), className),
    [variant, className]
  )

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={computedClassName}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

// ----------------------------------------------------------------------------
// Toast Sub-Components (Action, Close, Title, Description)
// ----------------------------------------------------------------------------

const ACTION_STYLES = cn(
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3",
  "text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1",
  "focus:ring-ring disabled:pointer-events-none disabled:opacity-50",
  "group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30",
  "group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground",
  "group-[.destructive]:focus:ring-destructive"
)

export const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => {
  const computedClassName = React.useMemo(
    () => cn(ACTION_STYLES, className),
    [className]
  )

  return (
    <ToastPrimitives.Action
      ref={ref}
      className={computedClassName}
      {...props}
    />
  )
})
ToastAction.displayName = ToastPrimitives.Action.displayName

const CLOSE_STYLES = cn(
  "absolute right-1 top-1 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity",
  "hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1",
  "group-hover:opacity-100 group-[.destructive]:text-red-300",
  "group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400",
  "group-[.destructive]:focus:ring-offset-red-600"
)

const CLOSE_ICON = <X className="h-4 w-4" />

export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => {
  const computedClassName = React.useMemo(
    () => cn(CLOSE_STYLES, className),
    [className]
  )

  return (
    <ToastPrimitives.Close
      ref={ref}
      className={computedClassName}
      toast-close=""
      {...props}
    >
      {CLOSE_ICON}
    </ToastPrimitives.Close>
  )
})
ToastClose.displayName = ToastPrimitives.Close.displayName

const TITLE_STYLES = "text-sm font-semibold [&+div]:text-xs"

export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => {
  const computedClassName = React.useMemo(
    () => cn(TITLE_STYLES, className),
    [className]
  )

  return (
    <ToastPrimitives.Title
      ref={ref}
      className={computedClassName}
      {...props}
    />
  )
})
ToastTitle.displayName = ToastPrimitives.Title.displayName

const DESCRIPTION_STYLES = "text-sm opacity-90"

export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => {
  const computedClassName = React.useMemo(
    () => cn(DESCRIPTION_STYLES, className),
    [className]
  )

  return (
    <ToastPrimitives.Description
      ref={ref}
      className={computedClassName}
      {...props}
    />
  )
})
ToastDescription.displayName = ToastPrimitives.Description.displayName

// ----------------------------------------------------------------------------
// Type Definitions & Exports
// ----------------------------------------------------------------------------

export type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
export type ToastActionElement = React.ReactElement<typeof ToastAction>

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 135,
  timestamp: "2026-09-20T03:54:19.746Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
