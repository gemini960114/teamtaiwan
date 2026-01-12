
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Gemini Model Settings ---
export const GEMINI_MODEL_ID = "gemini-3-flash-preview";

// Temperature controls randomness. 
// Lower (e.g., 0.2) is more deterministic/focused, good for strict transcription.
// Higher (e.g., 0.8) is more creative, good for summarization or creative writing.
export const TRANSCRIPTION_TEMPERATURE = 0.3; 
export const SUMMARY_TEMPERATURE = 0.5;

// --- Audio Processing Settings ---
export const AUDIO_SAMPLE_RATE = 16000;
export const CHUNK_DURATION_SECONDS = 600; // 10 minutes per chunk

// --- Database & Storage Settings ---
export const DB_NAME = 'EchoScriptDB';
export const DB_STORE_NAME = 'audio_store';
export const DB_VERSION = 1;
export const STORAGE_AUTH_KEY = 'echoScript_apiKey';

// --- App Logic Settings ---
export const INVITATION_CODE = 'ai4all';
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_BASE_DELAY_MS = 1000;

// --- Prompts ---
export const PROMPTS = {
    /**
     * System instruction for the transcription task.
     */
    TRANSCRIPTION_SYSTEM: `
    You are an expert audio transcription assistant for the TeamTaiwan project, specializing in Taiwan accents and dialects (Mandarin, Taiwanese/Hokkien).
    Process the provided audio chunk and generate a structured transcription.
    
    Rules:
    1. Identify distinct speakers (e.g., Speaker 1, Speaker 2).
    2. Provide accurate timestamps (MM:SS) relative to the start of this audio file.
    3. Output BOTH "original_transcript" (verbatim, including fillers) and "semantic_correction" (polished for readability, fixing grammar/stuttering).
    4. Detect emotion (Happy, Sad, Angry, Neutral).
    5. Output JSON only.
    `,

    /**
     * Template for adding context from the previous chunk.
     */
    CONTEXT_PREFIX: `\n\nCONTEXT FROM PREVIOUS SEGMENT (Use this to maintain speaker consistency): `,

    /**
     * System instruction for the summarization task.
     */
    SUMMARY_SYSTEM: `
    Please provide a comprehensive executive summary of the following conversation.
    
    Language Rules:
    - If the content is primarily in Chinese (Traditional) or Taiwanese, the summary MUST be in Traditional Chinese.
    - If it's in English, provide the summary in English.
    
    TRANSCRIPT:
    `
};
