export const SYNTHETIC_CORPUS = [
    {
        id: 'doc1_chunk1',
        ticker: 'RELIANCE',
        documentTitle: 'Q2 2026 Earnings Report',
        text: 'Reliance Industries reported a 15% increase in consolidated net profit. The retail segment showed strong growth, adding 200 new stores.'
    },
    {
        id: 'doc1_chunk2',
        ticker: 'RELIANCE',
        documentTitle: 'Q2 2026 Earnings Report',
        text: 'However, margins in the telecom sector were slightly compressed due to increased 5G spectrum amortization costs.'
    },
    {
        id: 'doc2_chunk1',
        ticker: 'RELIANCE',
        documentTitle: 'SEBI Regulatory Filing - Oct 2026',
        text: 'The company faces a pending regulatory review regarding its recent acquisition in the renewable energy sector. The outcome remains uncertain and could delay project timelines.'
    },
    {
        id: 'doc3_chunk1',
        ticker: 'TCS',
        documentTitle: 'Annual General Meeting Transcript',
        text: 'TCS management guided for double digit revenue growth for the upcoming fiscal year, citing strong AI deal momentum.'
    }
];
import { getEmbedding } from '../lib/gemini';
export async function initializeCorpus() {
    const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
    if (!hasApiKey) {
        console.warn('[Corpus] GEMINI_API_KEY not set — corpus will run without semantic embeddings.');
        console.warn('[Corpus] Fundamental RAG will use keyword fallback instead of embedding similarity.');
        // Assign zero-vector embeddings so corpus retrieval can still run in keyword mode
        for (const chunk of SYNTHETIC_CORPUS) {
            if (!chunk.embedding) {
                chunk.embedding = new Array(768).fill(0);
            }
        }
        return;
    }
    for (const chunk of SYNTHETIC_CORPUS) {
        if (!chunk.embedding) {
            try {
                chunk.embedding = await getEmbedding(chunk.text);
            }
            catch (err) {
                console.error(`[Corpus] Failed to embed chunk ${chunk.id}:`, err.message);
                chunk.embedding = new Array(768).fill(0);
            }
        }
    }
}
