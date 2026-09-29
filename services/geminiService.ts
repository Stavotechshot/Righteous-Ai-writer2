import { AIMode, AttachedMedia } from "../types";

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_RIGHTSHORE_API_URL) ||
  "https://rightshore-ai-backend.onrender.com";

const modeToAction: Record<AIMode, string> = {
  [AIMode.REPHRASE]: "Paraphrase",
  [AIMode.HUMANIZE]: "Humanize",
  [AIMode.RESPOND]: "Reply",
  [AIMode.GRAMMAR]: "Check & Improve",
  [AIMode.TRANSLATE]: "Translate",
  [AIMode.SHORTEN]: "Shorten",
  [AIMode.EMAIL]: "Email",
  [AIMode.DETECT]: "Detect",
  [AIMode.EXPAND]: "Expand"
};

async function callBackend(
  text: string,
  mode: AIMode,
  tone = "natural",
  targetLanguage = "English (US)",
  customSystemPrompt = "",
  attachedMedia?: AttachedMedia
): Promise<string> {
  const response = await fetch(`${API_URL.replace(/\/$/, "")}/v1/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: modeToAction[mode],
      text,
      tone,
      language: targetLanguage,
      instruction: customSystemPrompt,
      attachedMedia: attachedMedia
        ? { base64: attachedMedia.base64, mimeType: attachedMedia.mimeType, name: attachedMedia.name }
        : undefined
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `Rightshore AI request failed (${response.status})`);
  if (!data?.text) throw new Error("Rightshore AI returned an empty response.");
  return data.text;
}

export const processTextStream = async function* (
  text: string,
  mode: AIMode,
  tone = "natural",
  targetLanguage?: string,
  customSystemPrompt?: string,
  attachedMedia?: AttachedMedia
) {
  yield await callBackend(text, mode, tone, targetLanguage || "English (US)", customSystemPrompt || "", attachedMedia);
};

export const processText = async (
  text: string,
  mode: AIMode,
  tone = "natural",
  targetLanguage?: string,
  customSystemPrompt?: string,
  attachedMedia?: AttachedMedia
): Promise<string> =>
  callBackend(text, mode, tone, targetLanguage || "English (US)", customSystemPrompt || "", attachedMedia);

export const extractTextFromMedia = async (media: AttachedMedia): Promise<string> =>
  callBackend(
    "Extract every legible word from this image.",
    AIMode.GRAMMAR,
    "verbatim",
    "English (US)",
    "OCR mode: transcribe the image exactly. Return only the extracted text. Do not rewrite, summarize, correct, or explain.",
    media
  );
