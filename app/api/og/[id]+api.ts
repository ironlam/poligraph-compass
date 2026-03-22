// This endpoint will use @vercel/og to generate OG images.
// @vercel/og only works in Vercel Edge Functions.
// For now, return a placeholder. Implementation requires Vercel deployment.

export async function GET(request: Request, { id }: Record<string, string>) {
  // TODO: implement with @vercel/og after Vercel deployment
  // import { ImageResponse } from "@vercel/og";
  // return new ImageResponse(<CompassOGImage position={...} />, { width: 1200, height: 630 });

  return Response.json(
    { error: "OG image generation requires Vercel deployment" },
    { status: 501 }
  );
}
