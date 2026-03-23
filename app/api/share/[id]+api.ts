import { getShareResult } from "@/lib/kv";

export async function GET(request: Request, { id }: Record<string, string>) {
  if (!id) {
    return Response.json({ error: "Missing share ID" }, { status: 400 });
  }

  try {
    const result = await getShareResult(id);

    if (!result) {
      return Response.json(
        { error: "Share result not found" },
        { status: 404 }
      );
    }

    return Response.json(result, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("Failed to fetch share result:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
