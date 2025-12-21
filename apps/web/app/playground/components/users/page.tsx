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
import { Card, CardContent } from '@nn-stack/ui/components/card';

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
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* List Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            User Directory
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {users?.length || 0}
            </span>
          </h2>
          
          {isLoadingUsers ? (
            <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
              <div className="w-4 h-4 bg-muted rounded-full" />
              <span>Loading users...</span>
            </div>
          ) : (
            <ul className="space-y-3">
              {users?.map((user) => (
                <li
                  key={user.id}
                  className="p-4 border rounded-lg bg-card flex justify-between items-center shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
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
                        ? '...'
                        : 'Delete'}
                    </Button>
                  </div>
                </li>
              ))}
              {users?.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                  No users found.
                </div>
              )}
            </ul>
          )}
        </div>

        {/* Create Section */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <h2 className="text-xl font-semibold">Create New User</h2>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
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
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </form>

              {createUserMutation.isError && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                  Error: {createUserMutation.error.message}
                </div>
              )}

              {createUserMutation.isSuccess && (
                <div className="mt-4 p-3 bg-emerald-500/10 text-emerald-600 text-sm rounded-md">
                  User created successfully!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
