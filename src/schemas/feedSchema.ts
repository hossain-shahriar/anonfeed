import {z} from 'zod';

export const feedSchema = z.object({
    content: z
    .string()
    .min(10, "Content must be atleast 10 character")
    .max(500, "Content must be atmost 500 characters")
});