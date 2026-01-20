
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FINAI_SYSTEM_INSTRUCTION } from "../constants";

export class GeminiService {
  private primaryModel = 'gemini-3-pro-preview';
  private fallbackModel = 'gemini-3-flash-preview';
  private useFallback = false;

  private isQuotaError(error: any): boolean {
    if (!error) return false;

    try {
      // 1. Direct code check (most reliable)
      const code = error?.code || error?.error?.code || error?.status;
      if (code === 429 || code === '429') return true;

      // 2. Safe string check on status and message
      const status = error?.status ? String(error.status).toLowerCase() : "";
      const message = error?.message ? String(error.message).toLowerCase() : "";
      const nestedStatus = error?.error?.status ? String(error.error.status).toLowerCase() : "";
      const nestedMessage = error?.error?.message ? String(error.error.message).toLowerCase() : "";

      if (
        status.includes("resource_exhausted") ||
        nestedStatus.includes("resource_exhausted") ||
        message.includes("quota") ||
        nestedMessage.includes("quota") ||
        message.includes("rate_limit") ||
        nestedMessage.includes("rate_limit") ||
        status.includes("429") ||
        message.includes("429")
      ) {
        return true;
      }

      // 3. Last resort: JSON stringify but wrap in try-catch
      const errorStr = JSON.stringify(error).toLowerCase();
      return errorStr.includes("429") || errorStr.includes("resource_exhausted") || errorStr.includes("quota");
    } catch (e) {
      try {
        const fallbackStr = String(error).toLowerCase();
        return fallbackStr.includes("429") || fallbackStr.includes("quota");
      } catch {
        return false;
      }
    }
  }

  async analyzeData(context: string, userMessage: string): Promise<string> {
    const modelToUse = this.useFallback ? this.fallbackModel : this.primaryModel;
    // Create a new instance right before the call to ensure up-to-date configuration
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY });

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelToUse,
        contents: [
          { role: 'user', parts: [{ text: `CONTEXTO DOS DADOS:\n${context}\n\nMENSAGEM DO USUÁRIO: ${userMessage}` }] }
        ],
        config: {
          systemInstruction: FINAI_SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      return response.text || "Desculpe, não consegui processar os dados agora.";
    } catch (error: any) {
      console.error(`Gemini Error (${modelToUse}):`, error);

      if (this.isQuotaError(error) && !this.useFallback) {
        console.warn("Quota exceeded for Pro model. Switching to Flash model for this session...");
        this.useFallback = true;
        return this.analyzeData(context, userMessage);
      }

      if (this.isQuotaError(error)) {
        throw new Error("RATE_LIMIT_REACHED");
      }

      throw error;
    }
  }

  async sendMessage(history: { role: 'user' | 'model'; parts: { text: string }[] }[], context: string): Promise<string> {
    const modelToUse = this.useFallback ? this.fallbackModel : this.primaryModel;
    const lastUserMessage = history[history.length - 1].parts[0].text;
    const historyForChat = history.slice(0, history.length - 1);
    // Create a new instance right before the call to ensure up-to-date configuration
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY });

    try {
      const chat = ai.chats.create({
        model: modelToUse,
        history: historyForChat as any,
        config: {
          systemInstruction: `${FINAI_SYSTEM_INSTRUCTION}\n\nCONTEXTO:\n${context}`,
        },
      });

      const response = await chat.sendMessage({ message: lastUserMessage });
      return response.text || "Erro na comunicação.";
    } catch (error: any) {
      console.error(`Gemini Chat Error (${modelToUse}):`, error);

      if (this.isQuotaError(error) && !this.useFallback) {
        console.warn("Quota exceeded for Pro model during chat. Switching to Flash model...");
        this.useFallback = true;
        return this.sendMessage(history, context);
      }

      if (this.isQuotaError(error)) {
        throw new Error("RATE_LIMIT_REACHED");
      }

      throw error;
    }
  }
}
