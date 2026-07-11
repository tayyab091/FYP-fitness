"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

type AvatarElement = any
interface AvatarProps extends React.ComponentPropsWithoutRef<any> {
  size?: "default" | "sm" | "lg"
  children?: React.ReactNode
  className?: string
}

const Avatar = React.forwardRef<AvatarElement, AvatarProps>(
  ({ className, size = "default", children, ...props }, ref) => {
    const Root = AvatarPrimitive.Root as any;
    return (
      <Root
        ref={ref}
        data-slot="avatar"
        data-size={size}
        className={cn(
          "group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none data-[size=lg]:size-10 data-[size=sm]:size-6",
          className
        )}
        {...props}
      >
        {children}
      </Root>
    )
  }
)
Avatar.displayName = "Avatar"

type AvatarImageElement = any
interface AvatarImageProps extends React.ComponentPropsWithoutRef<any> {
  src?: string
  className?: string
}

const AvatarImage = React.forwardRef<AvatarImageElement, AvatarImageProps>(
  ({ className, ...props }, ref) => {
    const Image = AvatarPrimitive.Image as any;
    return (
      <Image
        ref={ref}
        data-slot="avatar-image"
        className={cn("aspect-square size-full", className)}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = "AvatarImage"

type AvatarFallbackElement = any
interface AvatarFallbackProps extends React.ComponentPropsWithoutRef<any> {
  children?: React.ReactNode
  className?: string
}

const AvatarFallback = React.forwardRef<AvatarFallbackElement, AvatarFallbackProps>(
  ({ className, children, ...props }, ref) => {
    const Fallback = AvatarPrimitive.Fallback as any;
    return (
      <Fallback
        ref={ref}
        data-slot="avatar-fallback"
        className={cn(
          "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",
          className
        )}
        {...props}
      >
        {children}
      </Fallback>
    )
  }
)
AvatarFallback.displayName = "AvatarFallback"

type AvatarBadgeElement = HTMLSpanElement
type AvatarBadgeProps = React.ComponentPropsWithoutRef<"span">

const AvatarBadge = React.forwardRef<AvatarBadgeElement, AvatarBadgeProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    />
  )
)
AvatarBadge.displayName = "AvatarBadge"

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
}
