import { generateJSON } from '../lib/gemini';
export async function runSentimentAgent(snapshot) {
    const timestamp = new Date().toISOString();
    const systemInstruction = `You are a behavioral/news market analyst. Assess the prevailing market/news sentiment from the provided headlines.
Determine the overall signal ('positive', 'negative', 'mixed').
Identify if there is explicit internal disagreement within the sentiment data itself (e.g. bullish headlines vs. bearish social chatter) and flag it as 'sentiment_conflict_detected'.
Return ONLY a JSON object matching this schema:
{
  "signal": "positive" | "negative" | "mixed",
  "confidence": number (0 to 1),
  "analysis_summary": string,
  "sentiment_conflict_detected": boolean,
  "key_evidence": [ string ],
  "risk_factors": [ string ]
}`;
    const prompt = `Ticker: ${snapshot.ticker}\n\nRecent Headlines/Social Chatter:\n${snapshot.newsHeadlines.map(h => `- ${h}`).join('\n')}`;
    let llmOutput = await generateJSON(prompt, systemInstruction);
    if (!llmOutput || !llmOutput.signal) {
        throw new Error("Invalid or empty response from Gemini API for sentiment analysis.");
    }
    return {
        agent_name: 'sentiment_intelligence_agent',
        analysis_summary: llmOutput.analysis_summary || 'Sentiment analysis complete.',
        signal: ['positive', 'negative', 'mixed'].includes(llmOutput.signal) ? llmOutput.signal : 'mixed',
        confidence: typeof llmOutput.confidence === 'number' ? llmOutput.confidence : 0.6,
        key_evidence: Array.isArray(llmOutput.key_evidence) ? llmOutput.key_evidence.slice(0, 3) : snapshot.newsHeadlines.slice(0, 3),
        sentiment_conflict_detected: !!llmOutput.sentiment_conflict_detected,
        risk_factors: Array.isArray(llmOutput.risk_factors) ? llmOutput.risk_factors : [],
        data_sources: ['News API', 'Social Media Scraper'],
        citations: ['sentiment_data_snapshot'],
        uncertainty: 'Sentiment is subjective and prone to rapid shifts.',
        timestamp
    };
}
