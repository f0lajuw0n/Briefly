import { NextResponse } from "next/server";
import {
  CohereAnalysisError,
  analyzeFeedbackWithCohere,
} from "@/lib/analyze-feedback-ai";
import type { AnalysisRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<AnalysisRequest>;

    if (
      !payload.brief?.projectName?.trim() ||
      !payload.brief?.goal?.trim() ||
      !payload.feedback?.trim()
    ) {
      return NextResponse.json(
        { error: "Project, goal, and feedback are required." },
        { status: 400 },
      );
    }

    const analysis = await analyzeFeedbackWithCohere(payload as AnalysisRequest);

    return NextResponse.json(
      { analysis: analysis.result, source: analysis.source },
      {
        headers: {
          "X-Clientese-Analysis-Source": analysis.source.provider,
        },
      },
    );
  } catch (error) {
    if (error instanceof CohereAnalysisError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "CLIENTESE could not analyze this feedback yet. Please try again." },
      { status: 500 },
    );
  }
}
