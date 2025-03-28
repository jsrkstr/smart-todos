import React from 'react';
import { TodoList } from '../components/TodoList';

export default function TasksPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
        <TodoList />
      </div>
    </div>
  );
} 