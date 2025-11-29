'use client';

import { orpc } from '@/lib/orpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@nn-stack/ui/components/button';
import { Input } from '@nn-stack/ui/components/input';
import { Checkbox } from '@nn-stack/ui/components/checkbox';
import { Trash2 } from 'lucide-react';

export function TodoList() {
  const queryClient = useQueryClient();
  const [newTodoText, setNewTodoText] = useState('');

  const { data: todos, isLoading } = useQuery(
    orpc.todos.getTodos.queryOptions(),
  );

  const createTodoMutation = useMutation(
    orpc.todos.createTodo.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.todos.key() });
        setNewTodoText('');
      },
    }),
  );

  const updateTodoMutation = useMutation(
    orpc.todos.updateTodo.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.todos.key() });
      },
    }),
  );

  const deleteTodoMutation = useMutation(
    orpc.todos.deleteTodo.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.todos.key() });
      },
    }),
  );

  const handleCreateTodo = () => {
    if (newTodoText.trim()) {
      createTodoMutation.mutate({ text: newTodoText.trim() });
    }
  };

  const handleToggleComplete = (id: number, completed: boolean) => {
    updateTodoMutation.mutate({ id, completed: !completed });
  };

  const handleDeleteTodo = (id: number) => {
    deleteTodoMutation.mutate({ id });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold text-center mb-4">Todo List</h1>
      <div className="flex gap-2 mb-4">
        <Input
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a new todo"
          onKeyDown={(e) => e.key === 'Enter' && handleCreateTodo()}
        />
        <Button
          onClick={handleCreateTodo}
          disabled={createTodoMutation.isPending}
        >
          Add
        </Button>
      </div>
      <ul className="space-y-2">
        {todos?.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-2 p-2 border rounded-md"
          >
            <Checkbox
              checked={!!todo.completed}
              onCheckedChange={() =>
                handleToggleComplete(todo.id, !!todo.completed)
              }
            />
            <span
              className={`flex-1 ${
                todo.completed ? 'line-through text-gray-500' : ''
              }`}
            >
              {todo.text}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteTodo(todo.id)}
              disabled={
                deleteTodoMutation.isPending &&
                deleteTodoMutation.variables?.id === todo.id
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
