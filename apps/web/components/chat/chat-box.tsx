"use client"

import { useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { Input } from "../ui/input"
import { Avatar } from "../ui/avatar"
import { Button } from "../ui/button"
import { useChatMessages } from "@/hooks/use-chat-messages"
import { ChatMessage } from "@/types/chat-message"
import { UIMessage } from "ai"
import { useTaskStore } from "@/lib/store"
import { useTagStore } from "@/lib/store/useTagStore"

interface ChatBoxProps {
  taskId?: string
}

export default function ChatBox({ taskId }: ChatBoxProps) {
  const { messages: chatMessages, loading: messagesLoading, loadMessages } = useChatMessages(taskId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { fetchTasks } = useTaskStore();
  const { fetchTags } = useTagStore();
  
  // Convert our chat messages to UI messages for the AI SDK
  const initialMessages: UIMessage[] = chatMessages.map(msg => ({
    id: msg.id,
    createdAt: new Date(msg.createdAt),
    role: msg.role,
    content: msg.content,
    parts: []
  }))

  const { messages, input, handleInputChange, handleSubmit, isLoading, data } = useChat({
    initialMessages: initialMessages.length > 0 ? initialMessages : [],
    api: '/api/chat-messages',
    body: {
      taskId
    }
  })

  // Load messages when component mounts
  useEffect(() => {
    loadMessages()
  }, [loadMessages, taskId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
    console.log('data', data);
    const anno = messages[messages.length-1]?.annotations
    console.log('messages anno', messages[messages.length-1]?.annotations)
    if (anno?.[0]?.response_type === 'task_details') {
      console.log('fetch tasks');
      fetchTasks(true);
      fetchTags(true);
    }
  }, [messages])

  useEffect(() => {
    const onResize = () => {
      const height = window.innerHeight - (window.visualViewport?.height ?? 0);
      if (height > 150) { // heuristically assuming keyboard is open
        document.documentElement.style.setProperty('--screen-keyboard-height', `${height}px`);
        document.documentElement.classList.add('keyboard-open');
        setTimeout(() => {
          messageAreaRef?.current?.scrollTo({ top: 10000 });
        }, 10);
      } else {
        document.documentElement.style.setProperty('--screen-keyboard-height', `0px`);
        document.documentElement.classList.remove('keyboard-open');
      }
    };

    window.visualViewport?.addEventListener("resize", onResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    // if (inputRef.current) {
    //   setTimeout(() => {
    //     inputRef.current?.focus();
    //   }, 0);
    //   inputRef.current.focus();
    // }
  }, [])

  return (
    <div className="flex flex-col bg-gray-100 mmmax-h-[50vh] h-[500px]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll-area" ref={messageAreaRef}>
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
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${message.role === "user"
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
      <div className="min-h-[65px]">
      <div className="bg-white p-3 border-t mobile-input">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            type="text"
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
    </div>
  )
}
