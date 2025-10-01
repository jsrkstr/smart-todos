from typing import Dict, Any, Optional
from langchain_core.messages import HumanMessage
from .types import State, Context


async def process_request(
    graph,
    user_id: str,
    message: str,
    thread_id: str,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Process a user request through the agent system.

    Args:
        graph: The compiled supervisor graph
        user_id: The ID of the user making the request
        message: The user's message/request
        thread_id: Thread ID for conversation persistence
        task_id: Optional task ID if the request is about a specific task

    Returns:
        Dictionary containing the agent's response and updated state
    """
    print(f"\n{'='*80}")
    print(f"🚀 [process_request] Starting new request")
    print(f"   User: {user_id[:8]}...")
    print(f"   Message: '{message[:60]}{'...' if len(message) > 60 else ''}'")
    print(f"   Thread: {thread_id}")
    print(f"   TaskId: {task_id or 'None'}")
    print(f"{'='*80}\n")

    try:

        # Prepare the initial state
        initial_state = State(
            userId=user_id,
            input=message,
            messages=[HumanMessage(content=message)],
            context=Context(taskId=task_id) if task_id else None
        )

        # Configure the graph execution
        config = {
            'configurable': {
                'thread_id': thread_id
            }
        }

        # Invoke the graph
        result = await graph.ainvoke(initial_state, config)

        # Extract the response
        response = {
            'response': result.get('agentResponse', 'No response generated'),
            'error': result.get('error'),
            'messages': [
                {
                    'role': 'assistant' if msg.type == 'ai' else 'user',
                    'content': msg.content,
                    'additional_kwargs': msg.additional_kwargs if hasattr(msg, 'additional_kwargs') else {}
                }
                for msg in result.get('messages', [])
            ]
        }

        print(f"\n{'='*80}")
        print(f"✅ [process_request] Request complete")
        print(f"   Response length: {len(response.get('response', ''))}")
        print(f"   Error: {response.get('error') or 'None'}")
        print(f"{'='*80}\n")

        return response

    except Exception as error:
        print(f"\n{'='*80}")
        print(f"❌ [process_request] Request failed: {error}")
        print(f"{'='*80}\n")
        return {
            'response': 'Sorry, I encountered an error processing your request.',
            'error': str(error),
            'messages': []
        }


async def main():
    """Main entry point for testing."""
    from .graph import create_supervisor_graph

    # Create graph once
    graph = create_supervisor_graph()

    # Example usage
    response = await process_request(
        graph=graph,
        user_id="test-user-id",
        message="Create a task to finish the project report by Friday",
        thread_id="test-thread-1"
    )

    print("Agent Response:")
    print(response['response'])

    if response.get('error'):
        print(f"\nError: {response['error']}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
