import { NextRequest, NextResponse } from "next/server";
import type { AssistantHistoryMessage } from "@/application/ai/assistant-use-cases";
import {
  AssistantCooldownError,
  createAssistantService,
} from "@/infrastructure/ai/assistant-service";
import { getSessionFromRequest } from "@/infrastructure/auth/session";

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 4000;

function parseHistory(body: unknown): AssistantHistoryMessage[] | null {
  if (typeof body !== "object" || body === null) return null;
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;

  const history: AssistantHistoryMessage[] = [];
  for (const raw of messages.slice(-MAX_MESSAGES)) {
    if (typeof raw !== "object" || raw === null) continue;
    const { role, content } = raw as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const trimmed = content.trim();
    if (!trimmed) continue;
    history.push({ role, content: trimmed.slice(0, MAX_CONTENT_LENGTH) });
  }

  return history.length > 0 ? history : null;
}

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json(await createAssistantService().getStatus(session.id));
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let history: AssistantHistoryMessage[] | null;
  try {
    history = parseHistory(await request.json());
  } catch {
    history = null;
  }

  if (!history) {
    return NextResponse.json({ error: "Se requiere al menos un mensaje." }, { status: 400 });
  }

  try {
    const result = await createAssistantService().reply(
      { userId: session.id, roleCode: session.roleCode },
      history,
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AssistantCooldownError) {
      return NextResponse.json(
        { error: error.message, cooldown: error.cooldown, model: error.model },
        { status: 429 },
      );
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}