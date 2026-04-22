
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { AIMode } from "../types";

/**
 * Helper to pause execution for a given number of milliseconds.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const processTextStream = async function* (
  text: string, 
  mode: AIMode, 
  tone: string = 'natural',
  targetLanguage?: string,
  customSystemPrompt?: string
) {
  const model = 'gemini-3-flash-preview';
  let systemInstruction = "";
  const humanizingConstraint = "CRITICAL: Avoid all 'AI-sounding' patterns. NEVER introduce yourself or use 'As an AI...'. Use natural sentence variety, human warmth, and authentic flow. Use contractions like \"it's\" or \"don't\". Avoid being overly helpful or repetitive. Never use robotic transitions like 'Overall' or 'In conclusion'. Strip away all clinical or academic structure.";

  switch (mode) {
    case AIMode.REPHRASE:
      systemInstruction = `You are an expert editor and vocabulary specialist for Rightshore AI. Provide 3 distinct rephrased versions of the input text. Each version should have a different style (e.g., Professional, Creative, Concise). 
      Format your response exactly like this:
      VERSION 1: [First version]
      VERSION 2: [Second version]
      VERSION 3: [Third version]
      
      Completely rewrite the text to make it more impactful, clear, and professional. Improve word choice and sentence structure while keeping the original meaning 100% intact. Tone: ${tone}. ${humanizingConstraint}`;
      break;
    case AIMode.HUMANIZE:
      systemInstruction = `You are a human-centric writing specialist for Rightshore AI. Your job is to strip away anything that sounds robotic or 'AI-generated'. Introduce subtle sentence length variations, personality, and natural transitions. Ensure the text would pass any AI detection as 'Highly Human'. Tone: ${tone}. ${humanizingConstraint}`;
      break;
    case AIMode.RESPOND:
      systemInstruction = `You are a Social and Relationship Intelligence expert for Rightshore AI. Your goal is to draft a response that sounds 100% human, emotionally intelligent, and socially savvy. 
      If the context is dating: be charismatic, use subtle wit, and focus on building romantic chemistry. Be playful and authentic. 
      If the context is a serious relationship: be empathetic, grounded, and focus on emotional connection. 
      NEVER sound like an assistant. Do not over-explain. Use natural, concise phrasing. 
      Tone: ${tone}. ${humanizingConstraint}`;
      break;
    case AIMode.GRAMMAR:
      systemInstruction = `You are the master proofreader and editor for Rightshore AI. Your mission is to refine the text for absolute clarity, grammatical correctness, and professional polish. Fix all spelling, punctuation, and syntax errors. Ensure the flow is smooth and the language is precise. CRITICAL: Do NOT change the core meaning or the author's original intent. Make it the best version of itself. Tone: ${tone}.`;
      break;
    case AIMode.TRANSLATE:
      systemInstruction = `Translate to ${targetLanguage || 'English'}. Make it sound like a native speaker of that language wrote it from scratch. Tone: ${tone}.`;
      break;
    case AIMode.SHORTEN:
      systemInstruction = `Cut the fluff. Make it punchy and brief without losing the core message. Tone: ${tone}.`;
      break;
    case AIMode.EMAIL:
      systemInstruction = `Draft a high-conversion email based on these points. Include a subject line. Tone: ${tone}. ${humanizingConstraint}`;
      break;
    case AIMode.DETECT:
      systemInstruction = `Analyze for AI signatures. Return a percentage score (0-100 where 100 is AI) followed by a brief 2-sentence explanation of why it feels human or robotic.`;
      break;
    case AIMode.EXPAND:
      systemInstruction = `You are a creative writing assistant for Rightshore AI. Your goal is to take the provided text and continue it, making it longer, more detailed, and more engaging. Maintain the original tone and style. Add relevant details, descriptions, or context to enrich the message. Tone: ${tone}. ${humanizingConstraint}`;
      break;
  }

  if (customSystemPrompt && customSystemPrompt.trim() !== "") {
    systemInstruction += `\n\nUSER-SPECIFIED CUSTOM PERSONA/COMMANDS (FOLLOW THESE STRICTLY): ${customSystemPrompt}`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContentStream({
      model,
      contents: [{ parts: [{ text: text.trim() }] }],
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
    throw error;
  }
};

export const processText = async (
  text: string, 
  mode: AIMode, 
  tone: string = 'natural',
  targetLanguage?: string,
  customSystemPrompt?: string,
  maxRetries = 3
): Promise<string> => {
  // Using the primary recommended model for text tasks
  const model = 'gemini-3-flash-preview';
  
  let systemInstruction = "";
  const humanizingConstraint = "CRITICAL: Avoid all 'AI-sounding' patterns. NEVER introduce yourself or use 'As an AI...'. Use natural sentence variety, human warmth, and authentic flow. Use contractions like \"it's\" or \"don't\". Avoid being overly helpful or repetitive. Never use robotic transitions like 'Overall' or 'In conclusion'. Strip away all clinical or academic structure.";

  switch (mode) {
    case AIMode.REPHRASE:
      systemInstruction = `You are an expert editor and vocabulary specialist for Rightshore AI. Provide 3 distinct rephrased versions of the input text. Each version should have a different style (e.g., Professional, Creative, Concise). 
      Format your response exactly like this:
      VERSION 1: [First version]
      VERSION 2: [Second version]
      VERSION 3: [Third version]
      
      Completely rewrite the text to make it more impactful, clear, and professional. Improve word choice and sentence structure while keeping the original meaning 100% intact. Tone: ${tone}. ${humanizingConstraint}`;
      break;
    case AIMode.HUMANIZE:
      systemInstruction = `You are a human-centric writing specialist for Rightshore AI. Your job is to strip away anything that sounds robotic or 'AI-generated'. Introduce subtle sentence length variations, personality, and natural transitions. Ensure the text would pass any AI detection as 'Highly Human'. Tone: ${tone}. ${humanizingConstraint}`;
      break;
    case AIMode.RESPOND:
      systemInstruction = `You are a Social and Relationship Intelligence expert for Rightshore AI. Your goal is to draft a response that sounds 100% human, emotionally intelligent, and socially savvy. 
      If the context is dating: be charismatic, use subtle wit, and focus on building romantic chemistry. Be playful and authentic. 
      If the context is a serious relationship: be empathetic, grounded, and focus on emotional connection. 
      NEVER sound like an assistant. Do not over-explain. Use natural, concise phrasing. 
      Tone: ${tone}. ${humanizingConstraint}`;
      break;
    case AIMode.GRAMMAR:
      systemInstruction = `You are the master proofreader and editor for Rightshore AI. Your mission is to refine the text for absolute clarity, grammatical correctness, and professional polish. Fix all spelling, punctuation, and syntax errors. Ensure the flow is smooth and the language is precise. CRITICAL: Do NOT change the core meaning or the author's original intent. Make it the best version of itself. Tone: ${tone}.`;
      break;
    case AIMode.TRANSLATE:
      systemInstruction = `Translate to ${targetLanguage || 'English'}. Make it sound like a native speaker of that language wrote it from scratch. Tone: ${tone}.`;
      break;
    case AIMode.SHORTEN:
      systemInstruction = `Cut the fluff. Make it punchy and brief without losing the core message. Tone: ${tone}.`;
      break;
    case AIMode.EMAIL:
      systemInstruction = `Draft a high-conversion email based on these points. Include a subject line. Tone: ${tone}. ${humanizingConstraint}`;
      break;
    case AIMode.DETECT:
      systemInstruction = `Analyze for AI signatures. Return a percentage score (0-100 where 100 is AI) followed by a brief 2-sentence explanation of why it feels human or robotic.`;
      break;
    case AIMode.EXPAND:
      systemInstruction = `You are a creative writing assistant for Rightshore AI. Your goal is to take the provided text and continue it, making it longer, more detailed, and more engaging. Maintain the original tone and style. Add relevant details, descriptions, or context to enrich the message. Tone: ${tone}. ${humanizingConstraint}`;
      break;
  }

  if (customSystemPrompt && customSystemPrompt.trim() !== "") {
    systemInstruction += `\n\nUSER-SPECIFIED CUSTOM PERSONA/COMMANDS (FOLLOW THESE STRICTLY): ${customSystemPrompt}`;
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model,
        contents: [{ 
          parts: [{ text: text.trim() }] 
        }],
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

      let friendlyMessage = "Rightshore AI is currently experiencing heavy load.";
      if (errorMessage.includes('code: 6')) {
        friendlyMessage = "Connection interrupted (RPC error). Please try again in a few seconds.";
      } else if (errorMessage.includes('xhr error')) {
        friendlyMessage = "Network timeout or proxy error. Please check your connection.";
      }

      throw new Error(friendlyMessage);
    }
  }

  throw new Error("Rightshore AI reached maximum retries without success.");
};
