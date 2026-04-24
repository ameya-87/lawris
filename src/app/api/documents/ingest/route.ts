import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { ingestDocument } from "@/lib/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  case_id: z.string().min(8),
  file_name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const case_id = formData.get("case_id") as string | null;
    const file_name = formData.get("file_name") as string | null;

    const parsed = bodySchema.safeParse({ case_id, file_name });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = supabaseServer();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: docData, error: docError } = await supabase
      .from("documents")
      .insert({
        case_id: parsed.data.case_id,
        name: parsed.data.file_name,
        doc_type: "other",
        phase: "intake",
        source: "uploaded",
        content: "",
      })
      .select()
      .single();

    if (docError || !docData) {
      return NextResponse.json(
        { error: "Failed to create document record" },
        { status: 500 },
      );
    }

    const sanitizedFileName = parsed.data.file_name
      .replace(/\.pdf$/i, "")
      .replace(/[^A-Za-z0-9._-]+/g, "_");
    const storagePath = `${parsed.data.case_id}/${docData.id}_${sanitizedFileName}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("case-documents")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError);
    } else {
      await supabase
        .from("documents")
        .update({ storage_path: storagePath })
        .eq("id", docData.id);
    }

    const chunksInserted = await ingestDocument(
      buffer,
      docData.id,
      parsed.data.case_id,
    );

    return NextResponse.json({
      ok: true,
      document_id: docData.id,
      chunks_inserted: chunksInserted,
      file_name: parsed.data.file_name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Ingest error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
