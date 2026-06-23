import { NextResponse } from "next/server";
import { getTask } from "@/lib/tasks";
import {
  createAttachment,
  listTaskAttachments,
  MAX_FILE_BYTES,
} from "@/lib/attachments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// List a task's attachments.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const attachments = await listTaskAttachments(id);
    return NextResponse.json({ attachments });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// Upload one or more files (multipart form-data, field name "files").
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const task = await getTask(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const form = await req.formData();
    const files = form
      .getAll("files")
      .filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided." }, { status: 400 });
    }

    const tooBig = files.find((f) => f.size > MAX_FILE_BYTES);
    if (tooBig) {
      return NextResponse.json(
        { error: `"${tooBig.name}" is larger than 10 MB.` },
        { status: 413 },
      );
    }

    const created = [];
    for (const file of files) {
      created.push(
        await createAttachment(id, {
          name: file.name,
          type: file.type,
          size: file.size,
          bytes: await file.arrayBuffer(),
        }),
      );
    }

    return NextResponse.json({ attachments: created });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
