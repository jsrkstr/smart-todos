"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"

interface MarkdownProps {
  content: string
  enableRehype?: boolean
}

export function Markdown({ content, enableRehype = true }: MarkdownProps) {
  const rehypePlugins = enableRehype ? [rehypeRaw] : []
  
  return (
    <ReactMarkdown
      rehypePlugins={rehypePlugins}
      components={{
        a: ({ node, href, children, ...props }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600" 
            {...props}
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}