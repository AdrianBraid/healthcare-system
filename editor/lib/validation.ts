import {z} from "zod"

export const userFormValidation = z.object({
  name: z.string()
  .min(2, { message: "Username must be at least 2 characters."})
  .max(50, { message: "Username must be at most 50 characters."}),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().refine((phone) => {
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    return phoneRegex.test(phone);
  }, { message: "Invalid phone number format. Use (XXX) XXX-XXXX." })
})