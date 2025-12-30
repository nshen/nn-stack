import { z } from 'zod';
import { os } from '@orpc/server';
import type { Context } from './context';

const planets = [
  { id: 1, name: 'Mercury', type: 'Terrestrial', distanceAu: 0.39 },
  { id: 2, name: 'Venus', type: 'Terrestrial', distanceAu: 0.72 },
  { id: 3, name: 'Earth', type: 'Terrestrial', distanceAu: 1.0 },
  { id: 4, name: 'Mars', type: 'Terrestrial', distanceAu: 1.52 },
  { id: 5, name: 'Jupiter', type: 'Gas Giant', distanceAu: 5.2 },
  { id: 6, name: 'Saturn', type: 'Gas Giant', distanceAu: 9.58 },
  { id: 7, name: 'Uranus', type: 'Ice Giant', distanceAu: 19.22 },
  { id: 8, name: 'Neptune', type: 'Ice Giant', distanceAu: 30.05 },
];

export const planetApi = {
  list: os
    .$context<Context>()
    .output(
      z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          type: z.string(),
          distanceAu: z.number(),
        }),
      ),
    )
    .handler(async () => {
      // Simulate network delay to make loading states visible if not SSR'd
      await new Promise((resolve) => setTimeout(resolve, 100));
      return planets;
    }),
};
