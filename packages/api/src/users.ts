import { z } from "zod";
import { users } from "@nn-stack/db";
import { os } from "@orpc/server";
import type { Context } from "./context";

const o = os.$context<Context>();

export const usersApi = {
  createUser: o.input(
    z.object({
      name: z.string(),
      email: z.email(),
    })
  ).handler(
    async ({ context, input }) => {
      const [newUser] = await context.DB.insert(users).values({ ...input, createdAt: new Date() }).returning();
      return newUser;
    }
  ),
};
