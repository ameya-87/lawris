"use server";

import { supabaseRequestClient } from "@/lib/supabase/ssr";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";

export async function signInAction(data: SignInInput) {
  const parsed = signInSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }
  
  const supabase = supabaseRequestClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
