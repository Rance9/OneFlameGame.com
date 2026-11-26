import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const news = defineCollection({
  loader: glob({ base: './src/content/news', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** One or two sentences for the cards on the main page and the News page. */
    summary: z.string(),
    /** Site path of the cover picture, for example /news/picture.png. */
    cover: z.string(),
    coverAlt: z.string(),
    coverCaption: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { news };
