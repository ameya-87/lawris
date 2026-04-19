import { z } from "zod";

export const BAR_COUNCIL_REGEX = /^[A-Za-z]{2,4}\/\d{3,6}\/\d{4}$/;
export const INDIA_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const signInSchema = z.object({
  identifier: z
    .string()
    .min(5, "Enter your email or Bar Council number")
    .refine(
      (v) => v.includes("@") || BAR_COUNCIL_REGEX.test(v),
      "Use a valid email (name@firm.in) or Bar Council number (e.g. MAH/12345/2018)",
    ),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Please enter your full name")
      .max(80, "Name is too long"),
    email: z.string().trim().email("Enter a valid email address").toLowerCase(),
    mobile: z
      .string()
      .trim()
      .regex(INDIA_MOBILE_REGEX, "Enter a 10-digit Indian mobile number"),
    bar_council_no: z
      .string()
      .trim()
      .regex(
        BAR_COUNCIL_REGEX,
        "Format: STATE/NUMBER/YEAR (e.g. MAH/12345/2018)",
      )
      .transform((v) => v.toUpperCase()),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/\d/, "Include a number"),
    confirm_password: z.string(),
    terms_accepted: z
      .literal(true, { message: "Please accept the Terms to continue" }),
  })
  .refine((d) => d.password === d.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
