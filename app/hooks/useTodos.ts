import { useState, useEffect } from 'react';
import { TodoItem } from '../components/Todo';

export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    // Load todos from localStorage on initialization
    if (typeof window !== 'undefined') {
      const savedTodos = localStorage.getItem('todos');
      if (savedTodos) {
        try {
          return JSON.parse(savedTodos);
        } catch (error) {
          console.error('Error parsing todos from localStorage', error);
          return [];
        }
      }
    }
    return [
      { id: '1', text: 'Learn React', completed: true },
      { id: '2', text: 'Create a Todo App', completed: false },
      { id: '3', text: 'Add styling to the app', completed: false },
    ];
  });

  // Save todos to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('todos', JSON.stringify(todos));
    }
  }, [todos]);

  const addTodo = (text: string) => {
    if (text.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: text.trim(),
        completed: false,
      };
      setTodos([newTodo, ...todos]);
      return true;
    }
    return false;
  };

  const toggleComplete = (id: string) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const editTodo = (id: string, newText: string) => {
    if (newText.trim()) {
      setTodos(
        todos.map(todo => (todo.id === id ? { ...todo, text: newText } : todo))
      );
      return true;
    }
    return false;
  };

  return {
    todos,
    addTodo,
    toggleComplete,
    deleteTodo,
    editTodo
  };
} 