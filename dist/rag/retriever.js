import { SYNTHETIC_CORPUS } from './corpus';
import { getEmbedding, cosineSimilarity } from '../lib/gemini';
export async function retrieveChunks(ticker, query) {
    const tickerDocs = SYNTHETIC_CORPUS.filter(doc => doc.ticker === ticker);
    if (!query || tickerDocs.length === 0) {
        return tickerDocs;
    }
    let queryEmbedding;
    try {
        queryEmbedding = await getEmbedding(query);
    }
    catch (err) {
        console.warn('[Retriever] getEmbedding failed, falling back to all ticker docs:', err.message);
        return tickerDocs;
    }
    // If API key is missing, embedding will be all zeros, fallback to basic keyword matching or all docs
    if (queryEmbedding.every(v => v === 0)) {
        return tickerDocs;
    }
    const scoredDocs = tickerDocs.map(doc => {
        const docEmb = doc.embedding || new Array(768).fill(0);
        const score = cosineSimilarity(queryEmbedding, docEmb);
        return { doc, score };
    });
    // Filter by relevance threshold and sort
    const RELEVANCE_THRESHOLD = 0.5; // Tuning parameter
    const relevantDocs = scoredDocs
        .filter(item => item.score > RELEVANCE_THRESHOLD)
        .sort((a, b) => b.score - a.score)
        .map(item => item.doc);
    return relevantDocs.slice(0, 3); // top 3 chunks
}
