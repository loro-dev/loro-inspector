import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "../../lib/utils"

const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
    <SliderPrimitive.Root
        ref={ref}
        className={cn(
            "relative flex w-full touch-none select-none items-center",
            className
        )}
        {...props}
    >
        <SliderPrimitive.Track
            className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-700/20 dark:bg-slate-500/20"
        >
            <SliderPrimitive.Range className="absolute h-full bg-indigo-500 dark:bg-indigo-400" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
            className="block h-5 w-5 rounded-full border-2 border-indigo-500 bg-white shadow-md ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-indigo-400 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-indigo-400 hover:scale-110 active:scale-95"
        />
    </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
