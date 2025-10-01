"""FastAPI server for the Python agent."""
import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from .index import process_request
from .graph import create_supervisor_graph

load_dotenv()

app = FastAPI(title="SmartTodos Agent API", version="1.0.0")

# Global graph instance - created once at startup
graph = None

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    userId: str
    message: str
    threadId: str
    taskId: Optional[str] = None


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response: str
    error: Optional[str] = None


@app.on_event("startup")
async def startup_event():
    """Initialize graph on startup."""
    global graph
    print("Initializing supervisor graph...")
    graph = create_supervisor_graph()
    print("Graph initialized successfully")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "smarttodos-agent"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process a chat request through the agent system.

    Args:
        request: Chat request with userId, message, threadId, and optional taskId

    Returns:
        ChatResponse with the agent's response
    """
    global graph

    if graph is None:
        raise HTTPException(status_code=503, detail="Graph not initialized")

    try:
        result = await process_request(
            graph=graph,
            user_id=request.userId,
            message=request.message,
            thread_id=request.threadId,
            task_id=request.taskId
        )

        return ChatResponse(
            response=result.get('response', 'No response generated'),
            error=result.get('error')
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "SmartTodos Agent API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "chat": "/api/chat"
        }
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
