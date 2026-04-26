import * as z from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .refine(
      (email) => {
        const lower = email.toLowerCase();
        return lower.endsWith('@uni.edu') || lower.endsWith('@st.uni.edu');
      },
      { message: 'Invalid Email Address' }
    ),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
