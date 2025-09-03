import {z} from "zod"
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const userFormValidation = z.object({
  name: z.string()
  .min(2, { message: "Username must be at least 2 characters."})
  .max(50, { message: "Username must be at most 50 characters."}),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().refine((phoneNumber) => {
      const phone = parsePhoneNumberFromString(phoneNumber || '');
      return phone ? phone.isValid() : false;
  }, "Invalid phone number")
})