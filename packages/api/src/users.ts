import { z } from 'zod';
import { users } from '@nn-stack/db';
import { ORPCError, os } from '@orpc/server';
import type { Context } from './context';
import { eq } from 'drizzle-orm';

const o = os.$context<Context>();

export const usersApi = {
  getUsers: o.handler(async ({ context }) => {
    const allUsers = await context.DB.select().from(users).all();
    return allUsers;
  }),
  createUser: o
    .input(
      z.object({
        name: z.string(),
        email: z.email(),
      }),
    )
    .handler(async ({ context, input }) => {
      const existingUser = await context.DB.select()
        .from(users)
        .where(eq(users.email, input.email))
        .get();
      if (existingUser) {
        throw new ORPCError('CONFLICT', { message: 'Email already in use.' });
      }
      const [newUser] = await context.DB.insert(users)
        .values({ ...input, createdAt: new Date() })
        .returning();
      return newUser;
    }),
  deleteUser: o
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .handler(async ({ context, input }) => {
      const [deletedUser] = await context.DB.delete(users)
        .where(eq(users.id, input.id))
        .returning();
      return deletedUser;
    }),
  updateUser: o
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.email().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const { id, ...updateData } = input;

      if (updateData.email) {
        const existingUser = await context.DB.select()
          .from(users)
          .where(eq(users.email, updateData.email))
          .get();
        if (existingUser && existingUser.id !== id) {
          throw new ORPCError('CONFLICT', {
            message: 'Email already in use.',
          });
        }
      }

      if (Object.keys(updateData).length === 0) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'No fields to update.',
        });
      }

      const [updatedUser] = await context.DB.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    }),
};
