
import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input data-[disabled=true]:bg-muted selection:bg-primary selection:text-primary-foreground file:text-primary file:data-[disabled=true]:text-muted-foreground placeholder:text-muted-foreground flex min-h-20 w-full resize-none rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
