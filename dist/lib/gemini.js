import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();
console.log("=========================================");
console.log("⚙️  Gemini API Initialization");
console.log(`🔑 API Key Detected: ${Boolean(process.env.GEMINI_API_KEY)}`);
console.log("=========================================\n");
const ai = new GoogleGenAI({});
export async function generateText(prompt, systemInstruction) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("CRITICAL: GEMINI_API_KEY environment variable is missing. Configure it in .env");
    }
    try {
        console.log(`[Gemini API] Request started: generateText (model: gemini-2.5-flash)`);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: systemInstruction ? { systemInstruction } : undefined,
        });
        console.log(`[Gemini API] Response received: generateText (length: ${response.text?.length || 0})`);
        return response.text || "";
    }
    catch (error) {
        console.error("[Gemini API] LLM Generation error:", error);
        throw new Error(`Gemini API failed: ${error.message}`);
    }
}
export async function generateJSON(prompt, systemInstruction, schema) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("CRITICAL: GEMINI_API_KEY environment variable is missing. Configure it in .env");
    }
    try {
        console.log(`[Gemini API] Request started: generateJSON (model: gemini-2.5-flash)`);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        if (response.text) {
            console.log(`[Gemini API] Response received: generateJSON (success)`);
            return JSON.parse(response.text);
        }
        throw new Error("Empty JSON response from Gemini API.");
    }
    catch (error) {
        console.error("[Gemini API] LLM JSON Generation error:", error);
        throw new Error(`Gemini JSON API failed: ${error.message}`);
    }
}
export async function getEmbedding(text) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("CRITICAL: GEMINI_API_KEY environment variable is missing. Configure it in .env");
    }
    try {
        console.log(`[Gemini API] Request started: embedContent`);
        const response = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: text
        });
        const embedding = response.embeddings?.[0]?.values;
        if (!embedding)
            throw new Error("No embedding returned");
        console.log(`[Gemini API] Response received: embedContent`);
        return embedding;
    }
    catch (error) {
        console.error("[Gemini API] Embedding error:", error);
        throw new Error(`Gemini Embedding API failed: ${error.message}`);
    }
}
export function cosineSimilarity(a, b) {
    if (a.length !== b.length || a.length === 0)
        return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0)
        return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
