"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  
  // Combine the forwarded ref with our local ref
  React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);
  
  // Function to adjust height
  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set the height to match the content
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);
  
  // Adjust height on content change
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Initial height adjustment
    adjustHeight();
    
    // Add event listeners for content changes
    const handleInput = () => adjustHeight();
    textarea.addEventListener('input', handleInput);
    
    // Clean up event listeners
    return () => {
      textarea.removeEventListener('input', handleInput);
    };
  }, [adjustHeight]);
  
  return (
    <textarea
      className={cn(
        "flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm overflow-hidden",
        className
      )}
      ref={textareaRef}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
