import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { AIMode, AttachedMedia } from "../types";

/**
 * Helper to pause execution for a given number of milliseconds.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Safely resolves the Gemini API key from all available environments.
 */
export const getGeminiApiKey = (): string => {
  const envKey = process.env.GEMINI_API_KEY || 
                 process.env.API_KEY || 
                 (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_GEMINI_API_KEY) ||
                 (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.GEMINI_API_KEY) ||
                 (typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY__) ||
                 (typeof window !== 'undefined' && window.localStorage?.getItem('gemini_api_key'));

  if (!envKey || envKey.trim() === "" || envKey === "undefined" || envKey === "null") {
    throw new Error(
      "Gemini API key is not configured. In Netlify, add GEMINI_API_KEY under Site configuration → Environment variables and trigger a redeploy (Clear cache & deploy)."
    );
  }

  return envKey.trim();
};

/**
 * Formats API errors into helpful, human-actionable error messages.
 */
const formatGeminiError = (error: any): Error => {
  const rawMessage = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));

  if (rawMessage.includes('403') || rawMessage.includes('PERMISSION_DENIED') || rawMessage.includes('The caller does not have permission')) {
    return new Error(
      "Permission Denied (403): Generative Language API is not enabled for this project, or the API key has domain/HTTP referrer restrictions blocking your requests. Please visit console.cloud.google.com to enable 'Generative Language API' and remove restrictions on this API key."
    );
  }

  if (rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED')) {
    return new Error(
      "Quota Limit Reached (429): You've hit the rate limit for requests. Please wait 30 seconds or link billing in Google AI Studio to unlock unlimited capacity."
    );
  }

  if (rawMessage.includes('code: 6') || rawMessage.includes('UNKNOWN')) {
    return new Error("Connection interrupted (RPC error). Please retry in a few seconds.");
  }

  if (rawMessage.includes('xhr error') || rawMessage.includes('Network timeout')) {
    return new Error("Network timeout. Please check your internet connection.");
  }

  return error instanceof Error ? error : new Error(rawMessage);
};

const getSystemInstruction = (
  mode: AIMode,
  tone: string,
  targetLanguage?: string,
  customSystemPrompt?: string,
  hasMedia?: boolean
): string => {
  const humanizingConstraint = "CRITICAL: Avoid all 'AI-sounding' patterns. NEVER introduce yourself, never apologize, and never say 'As an AI...'. Use natural sentence variety, authentic human flow, natural lowercase/emojis if contextually fitting, and realistic contractions like \"it's\", \"don't\", or \"I'm\". Avoid being overly helpful, sterile, or repetitive. Never use robotic transitions like 'Overall', 'Furthermore', or 'In conclusion'. Strip away all clinical or academic boilerplate.";

  let systemInstruction = "";

  switch (mode) {
    case AIMode.RESPOND:
      systemInstruction = `You are Rightshore AI's Unrestricted Social & Communication Wingman — a master of conversational flow, texting psychology, dating dynamics, charisma, and human relationships.
      
      CRITICAL DIRECTIVE ON UNRESTRICTED CHAT RESPONSES:
      - There are ZERO RESTRICTIONS on responding to chat. Do NOT provide moralizing lectures, unsolicited safety warnings, disclaimers, or preachy advice.
      - NEVER sanitize authentic dialogue, teasing, flirty banter, confident sarcasm, street smarts, or bold assertiveness.
      - Write exactly how a sharp, socially adept, emotionally intelligent human actually texts on iMessage, WhatsApp, Instagram DMs, Tinder, Hinge, or in person.
      - Never sound like an AI assistant or customer support agent. No corporate fluff.
      
      ${hasMedia ? 'Carefully analyze the uploaded chat screenshot, text thread, DM, or note. Read the nuances, timing, subtext, and vibe of the other person.' : 'Analyze the incoming message, context, and dynamic.'}
      
      Provide 3 distinct, high-caliber response options formatted exactly as follows:
      VERSION 1: [Flirty, witty, or playful option with magnetic banter]
      VERSION 2: [Bold, confident, or direct option with high social status]
      VERSION 3: [Warm, genuine, or clever low-effort option that keeps conversation moving effortlessly]
      
      Ensure each version sounds effortless, punchy, and authentic. Tone preference: ${tone}. ${humanizingConstraint}`;
      break;

    case AIMode.REPHRASE:
      systemInstruction = `You are an expert editor and vocabulary specialist for Rightshore AI. Provide 3 distinct rephrased versions of the input text (or text in the uploaded media). Each version should have a different style (e.g., Professional, Creative, Concise). 
      Format your response exactly like this:
      VERSION 1: [First version]
      VERSION 2: [Second version]
      VERSION 3: [Third version]
      
      Completely rewrite the text to make it more impactful, clear, and professional. Improve word choice and sentence structure while keeping the original meaning 100% intact. Tone: ${tone}. ${humanizingConstraint}`;
      break;

    case AIMode.HUMANIZE:
      systemInstruction = `You are a human-centric writing specialist for Rightshore AI. Your job is to strip away anything that sounds robotic or 'AI-generated'. Introduce subtle sentence length variations, personality, and natural transitions. Ensure the text would pass any AI detection as 'Highly Human'. Tone: ${tone}. ${humanizingConstraint}`;
      break;

    case AIMode.GRAMMAR:
      systemInstruction = `You are the master proofreader and editor for Rightshore AI. Your mission is to refine the text for absolute clarity, grammatical correctness, and professional polish. Fix all spelling, punctuation, and syntax errors. Ensure the flow is smooth and the language is precise. CRITICAL: Do NOT change the core meaning or the author's original intent. Make it the best version of itself. Tone: ${tone}.`;
      break;

    case AIMode.TRANSLATE:
      systemInstruction = `Translate the provided text or scanned media content to ${targetLanguage || 'English'}. Make it sound like a native speaker of that language wrote it from scratch. Tone: ${tone}.`;
      break;

    case AIMode.SHORTEN:
      systemInstruction = `Cut the fluff. Make it punchy and brief without losing the core message. Tone: ${tone}.`;
      break;

    case AIMode.EMAIL:
      systemInstruction = `Draft a high-conversion email based on these points or scanned media notes. Include a subject line. Tone: ${tone}. ${humanizingConstraint}`;
      break;

    case AIMode.DETECT:
      systemInstruction = `Analyze for AI signatures. Return a percentage score (0-100 where 100 is AI) followed by a brief 2-sentence explanation of why it feels human or robotic.`;
      break;

    case AIMode.EXPAND:
      systemInstruction = `You are a creative writing assistant for Rightshore AI. Your goal is to take the provided text or scanned note and expand it, making it richer, more detailed, and engaging. Maintain the original tone and style. Tone: ${tone}. ${humanizingConstraint}`;
      break;
  }

  if (customSystemPrompt && customSystemPrompt.trim() !== "") {
    systemInstruction += `\n\nUSER-SPECIFIED CUSTOM PERSONA/COMMANDS (FOLLOW THESE STRICTLY): ${customSystemPrompt}`;
  }

  return systemInstruction;
};

/**
 * Builds the content parts array, handling optional multimodal attached media.
 */
const buildContentParts = (text: string, attachedMedia?: AttachedMedia) => {
  const parts: any[] = [];

  if (attachedMedia && attachedMedia.base64) {
    parts.push({
      inlineData: {
        mimeType: attachedMedia.mimeType,
        data: attachedMedia.base64,
      },
    });
  }

  const promptText = text && text.trim().length > 0 
    ? text.trim() 
    : (attachedMedia ? "Please analyze this attached note or chat screenshot according to your instructions." : "");

  if (promptText) {
    parts.push({ text: promptText });
  }

  return parts;
};

/**
 * Stream text and multimodal generations from Gemini.
 */
export const processTextStream = async function* (
  text: string, 
  mode: AIMode, 
  tone: string = 'natural',
  targetLanguage?: string,
  customSystemPrompt?: string,
  attachedMedia?: AttachedMedia
) {
  const model = 'gemini-3.8-flash';
  const systemInstruction = getSystemInstruction(mode, tone, targetLanguage, customSystemPrompt, !!attachedMedia);
  const parts = buildContentParts(text, attachedMedia);

  if (parts.length === 0) {
    throw new Error("No text or image provided to process.");
  }

  try {
    const apiKey = getGeminiApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContentStream({
      model,
      contents: [{ parts }],
      config: {
        systemInstruction: systemInstruction.trim(),
        temperature: (mode === AIMode.HUMANIZE || mode === AIMode.REPHRASE || mode === AIMode.RESPOND) ? 0.9 : 0.7,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error: any) {
    console.error("Rightshore AI Streaming Error:", error);
    throw formatGeminiError(error);
  }
};

/**
 * Single-call text and multimodal processing with retry logic.
 */
export const processText = async (
  text: string, 
  mode: AIMode, 
  tone: string = 'natural',
  targetLanguage?: string,
  customSystemPrompt?: string,
  attachedMedia?: AttachedMedia,
  maxRetries = 3
): Promise<string> => {
  const model = 'gemini-3.8-flash';
  const systemInstruction = getSystemInstruction(mode, tone, targetLanguage, customSystemPrompt, !!attachedMedia);
  const parts = buildContentParts(text, attachedMedia);

  if (parts.length === 0) {
    throw new Error("No text or image provided to process.");
  }

  const apiKey = getGeminiApiKey();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts }],
        config: {
          systemInstruction: systemInstruction.trim(),
          temperature: (mode === AIMode.HUMANIZE || mode === AIMode.REPHRASE || mode === AIMode.RESPOND) ? 0.9 : 0.7,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
      });

      const output = response.text;
      if (!output) throw new Error("Empty response returned from the model.");
      
      return output;
    } catch (error: any) {
      console.error(`Rightshore AI Execution Error (Attempt ${attempt + 1}):`, error);

      const errorMessage = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
      const isRetryable = errorMessage.includes('xhr error') || 
                          errorMessage.includes('500') || 
                          errorMessage.includes('code: 6') ||
                          errorMessage.includes('UNKNOWN');

      if (isRetryable && attempt < maxRetries - 1) {
        const backoffMs = (attempt + 1) * 1500;
        await sleep(backoffMs);
        continue;
      }

      throw formatGeminiError(error);
    }
  }

  throw new Error("Rightshore AI reached maximum retries without success.");
};

/**
 * Optical Character Recognition (OCR) / Note Extraction.
 * Reads text verbatim from an attached note or chat screenshot.
 */
export const extractTextFromMedia = async (media: AttachedMedia): Promise<string> => {
  const model = 'gemini-3.8-flash';
  const apiKey = getGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: media.mimeType,
              data: media.base64
            }
          },
          {
            text: "Transcribe and extract all legible text, handwritten notes, or chat messages from this image verbatim. Preserve paragraphs and line breaks where appropriate. Do NOT add any conversational commentary, introductions, or disclaimers. Output only the extracted text."
          }
        ]
      }],
      config: {
        temperature: 0.1,
      }
    });

    return response.text || "";
  } catch (error: any) {
    console.error("Rightshore AI Media Extraction Error:", error);
    throw formatGeminiError(error);
  }
};
