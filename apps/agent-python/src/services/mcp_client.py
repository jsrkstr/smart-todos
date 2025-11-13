"""
MCP Client for Smart Todos

This module provides a Python client to interact with the Smart Todos MCP server.
It wraps MCP tool calls with proper authentication and error handling.
"""

import os
import json
import subprocess
from typing import Any, Dict, List, Optional


class MCPClient:
    """Client for interacting with Smart Todos MCP server"""

    def __init__(self, mcp_server_path: str, jwt_token: str):
        """
        Initialize MCP client

        Args:
            mcp_server_path: Path to the MCP server executable (apps/mcp-server)
            jwt_token: JWT authentication token for the user
        """
        self.mcp_server_path = mcp_server_path
        self.jwt_token = jwt_token
        self.process: Optional[subprocess.Popen] = None

    def _call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call an MCP tool

        Args:
            tool_name: Name of the tool to call
            arguments: Tool arguments (token will be added automatically)

        Returns:
            Tool execution result

        Raises:
            Exception: If tool call fails
        """
        # Add authentication token to arguments
        arguments_with_auth = {
            "token": self.jwt_token,
            **arguments
        }

        # Prepare MCP request
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments_with_auth
            }
        }

        # Start MCP server process if not running
        if self.process is None:
            self.process = subprocess.Popen(
                ["node", f"{self.mcp_server_path}/dist/index.js"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

        try:
            # Send request to MCP server
            self.process.stdin.write(json.dumps(request) + "\n")
            self.process.stdin.flush()

            # Read response
            response_line = self.process.stdout.readline()
            response = json.loads(response_line)

            if "error" in response:
                raise Exception(f"MCP tool error: {response['error']}")

            # Extract content from MCP response
            content = response.get("result", {}).get("content", [])
            if content and len(content) > 0:
                result_text = content[0].get("text", "{}")
                return json.loads(result_text)

            raise Exception("Invalid MCP response format")

        except Exception as e:
            raise Exception(f"Failed to call MCP tool '{tool_name}': {str(e)}")

    # Task operations
    def get_tasks(
        self,
        completed: Optional[bool] = None,
        priority: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        parent_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get tasks with optional filtering"""
        args = {}
        if completed is not None:
            args["completed"] = completed
        if priority:
            args["priority"] = priority
        if start_date:
            args["startDate"] = start_date
        if end_date:
            args["endDate"] = end_date
        if parent_id is not None:
            args["parentId"] = parent_id

        result = self._call_tool("getTasks", args)
        return result.get("data", [])

    def get_task(self, task_id: str) -> Dict[str, Any]:
        """Get a single task by ID"""
        result = self._call_tool("getTask", {"taskId": task_id})
        return result.get("data", {})

    def create_task(
        self,
        title: str,
        description: Optional[str] = None,
        priority: Optional[str] = None,
        due_date: Optional[str] = None,
        parent_id: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create a new task"""
        args = {"title": title}
        if description:
            args["description"] = description
        if priority:
            args["priority"] = priority
        if due_date:
            args["dueDate"] = due_date
        if parent_id:
            args["parentId"] = parent_id
        if tags:
            args["tags"] = tags

        result = self._call_tool("createTask", args)
        return result.get("data", {})

    def update_task(
        self,
        task_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        priority: Optional[str] = None,
        due_date: Optional[str] = None,
        completed: Optional[bool] = None,
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Update an existing task"""
        args = {"taskId": task_id}
        if title is not None:
            args["title"] = title
        if description is not None:
            args["description"] = description
        if priority is not None:
            args["priority"] = priority
        if due_date is not None:
            args["dueDate"] = due_date
        if completed is not None:
            args["completed"] = completed
        if tags is not None:
            args["tags"] = tags

        result = self._call_tool("updateTask", args)
        return result.get("data", {})

    def delete_task(self, task_id: str) -> bool:
        """Delete a task"""
        result = self._call_tool("deleteTask", {"taskId": task_id})
        return result.get("success", False)

    def get_subtasks(self, task_id: str) -> List[Dict[str, Any]]:
        """Get subtasks for a parent task"""
        result = self._call_tool("getSubtasks", {"taskId": task_id})
        return result.get("data", [])

    # User operations
    def get_user_profile(self) -> Dict[str, Any]:
        """Get user profile"""
        result = self._call_tool("getUserProfile", {})
        return result.get("data", {})

    def get_psych_profile(self) -> Optional[Dict[str, Any]]:
        """Get psychological profile"""
        result = self._call_tool("getPsychProfile", {})
        return result.get("data")

    def get_user_settings(self) -> Optional[Dict[str, Any]]:
        """Get user settings"""
        result = self._call_tool("getUserSettings", {})
        return result.get("data")

    # Chat operations
    def get_chat_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get chat history"""
        result = self._call_tool("getChatHistory", {"limit": limit})
        return result.get("data", [])

    def create_chat_message(self, role: str, content: str) -> Dict[str, Any]:
        """Create a chat message"""
        result = self._call_tool(
            "createChatMessage",
            {"role": role, "content": content}
        )
        return result.get("data", {})

    # Pomodoro operations
    def get_pomodoros(
        self,
        task_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get pomodoro sessions"""
        args = {}
        if task_id:
            args["taskId"] = task_id
        if start_date:
            args["startDate"] = start_date
        if end_date:
            args["endDate"] = end_date

        result = self._call_tool("getPomodoros", args)
        return result.get("data", [])

    def create_pomodoro(
        self,
        duration: int,
        completed: bool,
        task_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a pomodoro session"""
        args = {"duration": duration, "completed": completed}
        if task_id:
            args["taskId"] = task_id

        result = self._call_tool("createPomodoro", args)
        return result.get("data", {})

    def close(self):
        """Close the MCP client and cleanup"""
        if self.process:
            self.process.terminate()
            self.process.wait()
            self.process = None


# Singleton instance
_mcp_client: Optional[MCPClient] = None


def get_mcp_client(jwt_token: str) -> MCPClient:
    """
    Get or create MCP client instance

    Args:
        jwt_token: JWT authentication token

    Returns:
        MCPClient instance
    """
    global _mcp_client

    # Get MCP server path from environment or default
    mcp_server_path = os.environ.get(
        "MCP_SERVER_PATH",
        os.path.join(os.path.dirname(__file__), "../../../mcp-server")
    )

    if _mcp_client is None:
        _mcp_client = MCPClient(mcp_server_path, jwt_token)

    return _mcp_client
