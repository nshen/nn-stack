import { z } from 'zod';

export const HelloWorldSchema = z.object({
  name: z.string().min(1),
});

export type HelloWorldInput = z.infer<typeof HelloWorldSchema>;
