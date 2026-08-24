import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { audioFiles, materials } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [row] = await db
    .select({ data: audioFiles.data, fileName: audioFiles.fileName })
    .from(audioFiles)
    .innerJoin(materials, eq(audioFiles.materialId, materials.id))
    .where(and(eq(audioFiles.materialId, id), eq(materials.userId, session.user.id)))
    .limit(1);

  if (!row?.data) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = new Uint8Array(row.data);
  return new Response(bytes, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `inline; filename="${row.fileName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
