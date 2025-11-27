'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';
import { useState } from 'react';
import { Button } from '@nn-stack/ui/components/button';
import { Input } from '@nn-stack/ui/components/input';
import { Label } from '@nn-stack/ui/components/label';

export default function UsersPlayground() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const createUserMutation = useMutation(
    orpc.users.createUser.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({ name, email });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Create User</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            placeholder="John Doe"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            placeholder="john.doe@example.com"
            required
          />
        </div>
        <Button type="submit" disabled={createUserMutation.isPending}>
          {createUserMutation.isPending ? 'Creating...' : 'Create'}
        </Button>
      </form>

      {createUserMutation.isError && (
        <div className="mt-4 text-red-500">
          <p>Error: {createUserMutation.error.message}</p>
        </div>
      )}

      {createUserMutation.isSuccess && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">User Created:</h2>
          <pre className="bg-gray-100 p-4 rounded-md mt-2">
            {JSON.stringify(createUserMutation.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
