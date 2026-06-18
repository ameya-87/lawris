"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";
import type { CaseType, CasePhase } from "@/lib/types";

export async function createCaseAction(formData: FormData) {
  try {
    const lawyerId = await getLawyerId();
    const sb = supabaseServer();
    
    const title = formData.get("title") as string;
    const case_type = formData.get("case_type") as CaseType;
    const phase = formData.get("phase") as CasePhase;
    const court_name = formData.get("court_name") as string;

    const { data, error } = await sb
      .from("cases")
      .insert({
        lawyer_id: lawyerId,
        title,
        case_type,
        phase,
        status: "active",
        court_name: court_name || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    return { id: data.id };
  } catch (error: any) {
    return { error: error.message };
  }
}
