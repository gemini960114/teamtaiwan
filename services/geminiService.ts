
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptionSegment, Emotion } from "../types";
import { 
    GEMINI_MODEL_ID, 
    TRANSCRIPTION_TEMPERATURE, 
    SUMMARY_TEMPERATURE,
    PROMPTS 
} from "../constants";

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    // Perform a lightweight check.
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.generateContent({
        model: GEMINI_MODEL_ID,
        contents: "Test connection",
    });
    return true;
  } catch (error) {
    console.error("API Key Validation Error:", error);
    return false;
  }
};

const parseJson = (text: string) => {
    try {
        const cleanText = text.replace(/```json\n|\n```/g, "").trim();
        // Sometimes the model adds extra text outside the JSON block
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            return JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
        }
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Failed to parse JSON response:", e);
        return { segments: [] };
    }
};

export const transcribeChunk = async (
  apiKey: string,
  base64Audio: string,
  mimeType: string,
  previousContext?: string
): Promise<{ segments: TranscriptionSegment[] }> => {
  
  const ai = new GoogleGenAI({ apiKey });

  let prompt = PROMPTS.TRANSCRIPTION_SYSTEM;

  if (previousContext) {
    prompt += `${PROMPTS.CONTEXT_PREFIX}"${previousContext}"`;
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_ID,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        temperature: TRANSCRIPTION_TEMPERATURE,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING },
                  timestamp: { type: Type.STRING },
                  original_transcript: { type: Type.STRING },
                  semantic_correction: { type: Type.STRING },
                  emotion: { 
                    type: Type.STRING, 
                    enum: Object.values(Emotion)
                  },
                },
                required: ["speaker", "timestamp", "original_transcript", "semantic_correction", "emotion"],
              },
            },
          },
          required: ["segments"],
        },
      },
    });

    return parseJson(response.text || "{}");

  } catch (error) {
    console.error("Chunk Transcription Error:", error);
    throw error;
  }
};

export const generateSummary = async (
    apiKey: string,
    fullText: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
        ${PROMPTS.SUMMARY_SYSTEM}
        ${fullText.substring(0, 50000)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL_ID,
            contents: prompt,
            config: {
                temperature: SUMMARY_TEMPERATURE
            }
        });
        return response.text || "No summary available.";
    } catch (e) {
        console.error("Summary Generation Error:", e);
        return "Failed to generate summary.";
    }
}
