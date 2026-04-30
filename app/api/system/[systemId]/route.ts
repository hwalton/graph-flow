import { NextResponse } from "next/server";
import { loadSystem } from "@/lib/graph/loadSystem";

type RouteContext = {
  params: Promise<{ systemId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const { systemId } = await context.params;
    const system = await loadSystem(systemId);

    return NextResponse.json(system, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load system";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 }
    );
  }
}