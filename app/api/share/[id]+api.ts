export async function GET(request: Request, { id }: Record<string, string>) {
  // TODO: fetch from Vercel KV
  // const result = await kv.get(`share:${id}`);

  // Placeholder response
  return Response.json(
    { error: "Share result not found" },
    { status: 404 }
  );
}
