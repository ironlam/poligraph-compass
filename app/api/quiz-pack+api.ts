import { loadQuizPackData } from "@/lib/quiz-pack-loader";

export async function GET(request: Request) {
  const quizPack = await loadQuizPackData();

  return Response.json(quizPack, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
  });
}
