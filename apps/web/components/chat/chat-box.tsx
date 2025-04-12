"use client"

import { useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { useChat } from "@ai-sdk/react" // Using AI SDK for chat functionality [^1]
import { Input } from "../ui/input"
import { Avatar } from "../ui/avatar"
import { Button } from "../ui/button"
import { UIMessage } from "ai"

const initialMessages: UIMessage[] = [{
    "id": "w6MBApyOV8pxHag7",
    "createdAt": new Date("2025-04-12T17:36:31.284Z"),
    "role": "user",
    "content": "what is love",
    "parts": [],
    // "parts": [{ "type": "text", "text": "what is love" }]
},
{
    "id": "msg-bLW9OWcv62xU0rAKQHUVMbo5",
    "createdAt": new Date("2025-04-12T17:36:36.835Z"),
    "role": "assistant",
    "content": "Love is a complex and multifaceted emotion that can be difficult to define because it encompasses a range of feelings, behaviors, and attitudes. It often involves deep affection, care, and attachment towards someone or something. Love can manifest in various forms, such as:\\n\\n1. **Romantic Love**: This is often characterized by passion, intimacy, and commitment between partners. It involves a deep emotional connection and attraction.\\n\\n2. **Familial Love**: This type of love is the bond that exists between family members, such as the love between parents and children or among siblings. It is often unconditional and based on kinship and shared experiences.\\n\\n3. **Platonic Love**: This is a non-romantic love that exists between friends. It is based on mutual respect, shared interests, and emotional support.\\n\\n4. **Self-Love**: This involves having a healthy regard for your own well-being and happiness. It is about recognizing your worth and taking care of yourself physically, emotionally, and mentally.\\n\\n5. **Unconditional Love**: This is a selfless love that is given without expecting anything in return. It is often associated with parental love or spiritual love.\\n\\n6. **Compassionate Love**: This involves empathy and concern for others, often motivating acts of kindness and altruism.\\n\\nLove is a fundamental human experience that can bring joy and fulfillment, but it can also be challenging and complex, involving vulnerability and sacrifice. It is a central theme in art, literature, and philosophy, reflecting its importance in human life.",
    "parts": [],
    // "parts": [{ "type": "step-start" }, { "type": "text", "text": "Love is a complex and multifaceted emotion that can be difficult to define because it encompasses a range of feelings, behaviors, and attitudes. It often involves deep affection, care, and attachment towards someone or something. Love can manifest in various forms, such as:\\n\\n1. **Romantic Love**: This is often characterized by passion, intimacy, and commitment between partners. It involves a deep emotional connection and attraction.\\n\\n2. **Familial Love**: This type of love is the bond that exists between family members, such as the love between parents and children or among siblings. It is often unconditional and based on kinship and shared experiences.\\n\\n3. **Platonic Love**: This is a non-romantic love that exists between friends. It is based on mutual respect, shared interests, and emotional support.\\n\\n4. **Self-Love**: This involves having a healthy regard for your own well-being and happiness. It is about recognizing your worth and taking care of yourself physically, emotionally, and mentally.\\n\\n5. **Unconditional Love**: This is a selfless love that is given without expecting anything in return. It is often associated with parental love or spiritual love.\\n\\n6. **Compassionate Love**: This involves empathy and concern for others, often motivating acts of kindness and altruism.\\n\\nLove is a fundamental human experience that can bring joy and fulfillment, but it can also be challenging and complex, involving vulnerability and sacrifice. It is a central theme in art, literature, and philosophy, reflecting its importance in human life." }],
}, {
    "id": "R84Lh1JnTD3YGzJT",
    "createdAt": new Date("2025-04-12T18:00:51.701Z"),
    "role": "user",
    "content": "what is it called in french?",
    "parts": [],
    // "parts": [{ "type": "text", "text": "what is it called in french?" }]
}, {
    "id": "msg-c0cdUdAVZvyKg1PsmJdqKzAr",
    "createdAt": new Date("2025-04-12T18:00:52.988Z"),
    "role": "assistant",
    "content": "In French, the word for love is amour Just like in English, amour can refer to different types of love depending on the context. For example:\\n\\n- **L'amour romantique**: Romantic love\\n- **L'amour familial**: Familial love\\n- **L'amour platonique**: Platonic love\\n- **L'amour de soi**: Self-love\\n- **L'amour inconditionnel**: Unconditional love\\n- **L'amour compatissant**: Compassionate love\\n\\nThe concept of love is similarly rich and nuanced in French culture, and amour is a central theme in French literature, music, and art.",
    "parts": [],
    // "parts": [{ "type": "step-start" }, {"type": "text", "text": "In French, the word for love is amour. Just like in English, amour can refer to different types of love depending on the context. For example:\\n\\n- **L'amour romantique**: Romantic love\\n- **L'amour familial**: Familial love\\n- **L'amour platonique**: Platonic love\\n- **L'amour de soi**: Self-love\\n- **L'amour inconditionnel**: Unconditional love\\n- **L'amour compatissant**: Compassionate love\\n\\nThe concept of love is similarly rich and nuanced in French culture, and amour is a central theme in French literature, music, and art."}],
}];

export default function ChatBox() {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        initialMessages: initialMessages,
    }) // Using useChat hook from AI SDK [^1]
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    useEffect(() => {
        if (inputRef.current) {
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
