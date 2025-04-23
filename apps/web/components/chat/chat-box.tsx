"use client"

import { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from "react"
import { Send } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import ReactMarkdown from "react-markdown"
import { Input } from "../ui/input"
import { Avatar } from "../ui/avatar"
import { Button } from "../ui/button"
import { useChatMessages } from "@/hooks/use-chat-messages"
import { ChatMessage } from "@/types/chat-message"
import { ChatRequestOptions, CreateMessage, Message, tool, UIMessage } from "ai"
import { useTaskStore } from "@/lib/store"
import { useTagStore } from "@/lib/store/useTagStore"
import { Textarea } from "../ui/textarea"

// Define the imperative handle type
export interface ChatBoxHandle {
  addMessage: (message: Message | CreateMessage) => Promise<string | null | undefined>;
}

interface ChatBoxProps {
  taskId?: string
  slotContent?: React.ReactNode
  onLoadingChange?: (loading: boolean) => void
}

const ChatBox = forwardRef(({ taskId, slotContent, onLoadingChange }: ChatBoxProps, ref) => {
  const { messages: chatMessages, loading: messagesLoading, loadMessages } = useChatMessages(taskId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
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

  const { messages, input, handleInputChange, handleSubmit, data, append, isLoading } = useChat({
    initialMessages: initialMessages.length > 0 ? initialMessages : [],
    // api: '/api/chat-messages',
    body: {
      taskId
    },
    onToolCall: ({ toolCall }) => {
      console.log('toolcall:', toolCall);
    },
    onFinish: async (message: Message) => {
      const toolNames = message.parts?.filter(part => part.type === 'tool-invocation')
        .map((part) => part.toolInvocation.toolName)
      
      console.log('onfinish', message, toolNames);
      const taskModifyingTools = ['update_task', 'update_tasks_many', 'create_subtasks', 'create_task'];
      if (toolNames?.some(tool => taskModifyingTools.includes(tool))) {
        fetchTasks(true);
        fetchTags(true);
      }
    },
  })

  useEffect(() => {
    onLoadingChange && onLoadingChange(isLoading);
  }, [isLoading])

  // Load messages when component mounts
  useEffect(() => {
    loadMessages()
  }, [loadMessages, taskId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
    console.log('data', data);

    // // Check if message contains annotations with a response_type property
    // const latestMessage = messages[messages.length-1];
    // // const hasTaskDetailsAnnotation = latestMessage?.annotations?.some(
    // //   (anno: any) => anno?.response_type === 'task_details'
    // // );

    // // https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot-tool-usage#client-side-page
    // const hasToolInvocations = latestMessage?.toolInvocations?.some(
    //   (ti: any) => ti?.toolName === 'update_task'
    // );

    // if (hasToolInvocations) {
    //   console.log('fetch tasks');
    //   // fetchTasks(true);
    //   // fetchTags(true);
    // }
  }, [messages, fetchTasks, fetchTags, data])

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

  // focus on input
  useEffect(() => {
    // if (inputRef.current) {
    //   setTimeout(() => {
    //     inputRef.current?.focus();
    //   }, 0);
    //   inputRef.current.focus();
    // }
  }, [])

  useImperativeHandle(ref, () => ({
    addMessage: (message: Message) => {
      return append(message);
    }
  }));

  return (
    <div className="flex flex-col bg-gray-100 mmmax-h-[50vh]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll-area max-h-[50vh] min-h-[40vh]" ref={messageAreaRef}>
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
                {message.role === "user" ? (
                  message.content
                ) : (
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                )}
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

        {/* Slot area for custom content */}
        {slotContent && (
          <div className="mt-4 mb-2">
            {slotContent}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="min-h-[65px] mobile-box">
        <div className="bg-white p-3 border-t mobile-input">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              type="text"
              className="flex-1 rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
              rows={1}
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
});

export default ChatBox;
