'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';
import { useState } from 'react';
import { Button } from '@nn-stack/ui/components/button';
import { Input } from '@nn-stack/ui/components/input';
import { Label } from '@nn-stack/ui/components/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nn-stack/ui/components/dialog';

type User = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
};

export default function UsersPlayground() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: users, isLoading: isLoadingUsers } = useQuery(
    orpc.users.getUsers.queryOptions(),
  );

  const createUserMutation = useMutation({
    ...orpc.users.createUser.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.users.getUsers.queryKey(),
      });
      setName('');
      setEmail('');
    },
  });

  const updateUserMutation = useMutation({
    ...orpc.users.updateUser.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.users.getUsers.queryKey(),
      });
      setIsEditDialogOpen(false);
    },
  });

  const deleteUserMutation = useMutation({
    ...orpc.users.deleteUser.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.users.getUsers.queryKey(),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({ name, email });
  };

  const handleDelete = (id: number) => {
    deleteUserMutation.mutate({ id });
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        name: editName,
        email: editEmail,
      });
    }
  };

  return (
    <div className="p-4">
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">All Users</h2>
        {isLoadingUsers ? (
          <p>Loading users...</p>
        ) : (
          <ul className="space-y-2">
            {users?.map((user) => (
              <li
                key={user.id}
                className="p-2 border rounded-md flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(user)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    disabled={
                      deleteUserMutation.isPending &&
                      deleteUserMutation.variables?.id === user.id
                    }
                  >
                    {deleteUserMutation.isPending &&
                    deleteUserMutation.variables?.id === user.id
                      ? 'Deleting...'
                      : 'Delete'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <h1 className="text-2xl font-bold mb-4 mt-8">Create User</h1>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the user&apos;s details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
          </div>
          {updateUserMutation.isError && (
            <div className="mt-4 text-red-500">
              <p>Error: {updateUserMutation.error.message}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
