"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Accordion as AccordionPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

interface AccordionProps extends React.ComponentPropsWithoutRef<any> {
  children?: React.ReactNode
}

const Accordion = React.forwardRef<
  React.ElementRef<any>,
  AccordionProps
>(({ children, ...props }, ref) => {
  const Root = AccordionPrimitive.Root as any;
  return (
    <Root ref={ref} data-slot="accordion" {...props}>
      {children}
    </Root>
  )
})
Accordion.displayName = "Accordion"

interface AccordionItemProps extends React.ComponentPropsWithoutRef<any> {
  children?: React.ReactNode
  value: string
}

const AccordionItem = React.forwardRef<
  React.ElementRef<any>,
  AccordionItemProps
>(({ className, value, ...props }, ref) => {
  const Item = AccordionPrimitive.Item as any;
  return (
    <Item
      ref={ref}
      value={value}
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
})
AccordionItem.displayName = "AccordionItem"

interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<any> {
  children?: React.ReactNode
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<any>,
  AccordionTriggerProps
>(({ className, children, ...props }, ref) => {
  const Trigger = AccordionPrimitive.Trigger as any;
  const Header = AccordionPrimitive.Header as any;
  return (
    <Header className="flex">
      <Trigger
        ref={ref}
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200" />
      </Trigger>
    </Header>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

interface AccordionContentProps extends React.ComponentPropsWithoutRef<any> {
  children?: React.ReactNode
  className?: string
}

const AccordionContent = React.forwardRef<
  React.ElementRef<any>,
  AccordionContentProps
>(({ className, children, ...props }, ref) => {
  const Content = AccordionPrimitive.Content as any;
  return (
    <Content
      ref={ref}
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </Content>
  )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
