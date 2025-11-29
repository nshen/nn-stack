import { z } from 'zod';
import { todos } from '@nn-stack/db';
import { ORPCError, os } from '@orpc/server';
import type { Context } from './context';
import { eq } from 'drizzle-orm';

const o = os.$context<Context>();

export const todosApi = {
  getTodos: o.handler(async ({ context }) => {
    const allTodos = await context.DB.select().from(todos).all();
    return allTodos;
  }),
  createTodo: o
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const [newTodo] = await context.DB.insert(todos)
        .values({ ...input, createdAt: new Date() })
        .returning();
      return newTodo;
    }),
  updateTodo: o
    .input(
      z.object({
        id: z.number(),
        text: z.string().optional(),
        completed: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const { id, ...updateData } = input;
      const [updatedTodo] = await context.DB.update(todos)
        .set(updateData)
        .where(eq(todos.id, id))
        .returning();
      if (!updatedTodo) {
        throw new ORPCError('NOT_FOUND');
      }
      return updatedTodo;
    }),
  deleteTodo: o
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .handler(async ({ context, input }) => {
      const [deletedTodo] = await context.DB.delete(todos)
        .where(eq(todos.id, input.id))
        .returning();
      if (!deletedTodo) {
        throw new ORPCError('NOT_FOUND');
      }
      return deletedTodo;
    }),
};
