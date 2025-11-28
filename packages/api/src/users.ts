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
};
