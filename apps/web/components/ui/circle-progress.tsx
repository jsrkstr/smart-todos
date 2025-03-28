"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CircleProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  backgroundColor?: string
  progressColor?: string
}

export function CircleProgress({
  value = 0,
  size = 100,
  strokeWidth = 8,
  className,
  backgroundColor = "stroke-muted",
  progressColor = "stroke-primary",
  ...props
}: CircleProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const dash = (value * circumference) / 100
  
  return (
    <div className={cn("relative", className)} {...props}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={backgroundColor}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          strokeLinecap="round"
          className={`transition-all duration-500 ease-in-out ${progressColor}`}
        />
      </svg>
    </div>
  )
} 