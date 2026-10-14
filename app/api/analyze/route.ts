import { NextResponse } from "next/server";
import { analyzeFeedbackWithAI } from "@/lib/analyze-feedback-ai";
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

    const analysis = await analyzeFeedbackWithAI(payload as AnalysisRequest);

    return NextResponse.json(analysis.result, {
      headers: {
        "X-Briefly-Analysis-Source": analysis.source,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Briefly could not analyze this feedback yet." },
      { status: 500 },
    );
  }
}
