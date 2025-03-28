import React, { useState } from 'react';
import { Todo } from './Todo';
import { useTodos } from '../hooks/useTodos';

export function TodoList() {
  const { todos, addTodo, toggleComplete, deleteTodo, editTodo } = useTodos();
  const [newTodoText, setNewTodoText] = useState('');

  const handleAddTodo = () => {
    if (addTodo(newTodoText)) {
      setNewTodoText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Smart Todos</h1>
      
      <div className="flex mb-4">
        <input
          className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a new task..."
          onKeyDown={handleKeyDown}
        />
        <button
          className={`px-4 py-2 rounded-r-md text-white ${
            newTodoText.trim() ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed'
          }`}
          onClick={handleAddTodo}
          disabled={!newTodoText.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        {todos.map(todo => (
          <Todo
            key={todo.id}
            todo={todo}
            onToggleComplete={toggleComplete}
            onDelete={deleteTodo}
            onEdit={editTodo}
          />
        ))}
      </div>
      
      {todos.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500 text-center">
          {todos.filter(todo => todo.completed).length} of {todos.length} tasks completed
        </div>
      )}
    </div>
  );
} 