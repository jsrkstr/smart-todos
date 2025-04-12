"use client"

import { useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { useChat } from "@ai-sdk/react" // Using AI SDK for chat functionality [^1]
import { Input } from "../ui/input"
import { Avatar } from "../ui/avatar"
import { Button } from "../ui/button"

export default function ChatBox() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat() // Using useChat hook from AI SDK [^1]
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (inputRef.current) {
        console.log("Element:", inputRef.current);
        setTimeout(() => {
            inputRef.current?.focus();    
        }, 10);
        inputRef.current.focus();
      }
  }, [])

  return (
    <div className="flex flex-col bg-gray-100 mmmax-h-[50vh] h-[500px]">
      {/* Header */}
      {/* <div className="bg-white p-4 shadow-sm flex items-center space-x-3 sticky top-0 z-10">
        <Avatar className="h-10 w-10 bg-primary">
          <span className="text-white font-semibold">B</span>
        </Avatar>
        <div>
          <h1 className="font-semibold">ChatBot</h1>
          <p className="text-xs text-gray-500">Online</p>
        </div>
      </div> */}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Send a message to start chatting with the bot</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role !== "user" && (
                <Avatar className="h-8 w-8 mr-2 mt-1 bg-primary">
                  <span className="text-white text-xs font-semibold">B</span>
                </Avatar>
              )}
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  message.role === "user"
                    ? "bg-primary text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <Avatar className="h-8 w-8 mr-2 mt-1 bg-primary">
              <span className="text-white text-xs font-semibold">B</span>
            </Avatar>
            <div className="bg-gray-200 px-4 py-2 rounded-2xl rounded-bl-none">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-white p-3 border-t">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 rounded-full border-gray-300 focus:border-primary focus:ring-primary"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full h-10 w-10 flex items-center justify-center"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
