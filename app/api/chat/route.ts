import { NextRequest, NextResponse } from "next/server";
import { processRAGChat } from "@/lib/rag";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'question' field in request body." },
        { status: 400 }
      );
    }

    const result = await processRAGChat(question.trim());

    return NextResponse.json({
      success: true,
      question: question.trim(),
      answer: result.answer,
      sources: result.sources,
      retrievedCount: result.sources.length,
    });
  } catch (error: any) {
    console.error("Error handling /api/chat:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error.message,
        answer: "I don't have enough sensor data to answer that.",
      },
      { status: 500 }
    );
  }
}
