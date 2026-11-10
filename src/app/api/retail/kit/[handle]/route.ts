import { getProduct } from "@/lib/catalog";
import { getProductReviews } from "@/lib/reviews";
import { buildKit, kitToMarkdown } from "@/lib/b2b/kit";
import { getSession } from "@/lib/auth/session";

type Params = { params: Promise<{ handle: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!(await getSession())) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { handle } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(handle)) return new Response("Not found", { status: 404 });
  const [product, intel] = await Promise.all([getProduct(handle), getProductReviews(handle)]);
  if (!product) return new Response("Not found", { status: 404 });

  return new Response(kitToMarkdown(buildKit(product, intel)), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${handle}-marketing-kit.md"`,
      "Cache-Control": "no-store",
    },
  });
}
