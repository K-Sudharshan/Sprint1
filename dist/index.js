import { runMarketSignalAgent } from './agents/marketSignalAgent';
import { runSentimentAgent } from './agents/sentimentAgent';
import { runFundamentalRagAgent } from './agents/fundamentalRagAgent';
import { synthesize } from './synthesis/synthesisAgent';
import { runCounterfactual } from './synthesis/counterfactual';
import { initializeCorpus } from './rag/corpus';
/**
 * Wraps an agent Promise with real start/end timestamp telemetry.
 * Uses Promise.allSettled semantics — never throws, always resolves with
 * either a successful output or null + an error string.
 */
async function runWithTelemetry(agentName, displayName, agentFn) {
    const startTime = Date.now();
    try {
        const result = await agentFn;
        const endTime = Date.now();
        return {
            result,
            telemetry: {
                agentName,
                displayName,
                startTime,
                endTime,
                durationMs: endTime - startTime,
                status: 'success'
            }
        };
    }
    catch (err) {
        const endTime = Date.now();
        console.error(`[Agent Failed] ${displayName}:`, err?.message || err);
        return {
            result: null,
            telemetry: {
                agentName,
                displayName,
                startTime,
                endTime,
                durationMs: endTime - startTime,
                status: 'failed',
                error: err?.message || String(err)
            }
        };
    }
}
export async function runSession(ticker, userProfile) {
    const orchestrationStart = Date.now();
    // ── Build deterministic but ticker-specific market snapshot ──
    const hash = Array.from(ticker).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pseudoRand = (min, max, offset) => {
        const val = Math.sin(hash * 13.37 + offset) * 10000;
        return min + (val - Math.floor(val)) * (max - min);
    };
    const basePrice = pseudoRand(50, 500, 1);
    const rsi = pseudoRand(20, 80, 2);
    const maShort = basePrice * pseudoRand(0.9, 1.1, 3);
    const maLong = basePrice * pseudoRand(0.85, 1.15, 4);
    const volBase = Math.floor(pseudoRand(500000, 2000000, 5));
    const currentVol = Math.floor(volBase * pseudoRand(0.5, 2.5, 6));
    const allHeadlines = [
        'Company announces record breaking quarterly earnings',
        'Market rally continues pushing sector higher',
        'Some concern over impending regulatory changes',
        'Unexpected leadership change shakes investor confidence',
        'New product launch receives mixed reviews',
        'Global supply chain issues threaten margins',
        'Analyst upgrades stock to strong buy',
        'Legal dispute settled favorably'
    ];
    const h1 = allHeadlines[Math.floor(pseudoRand(0, allHeadlines.length, 7))];
    const h2 = allHeadlines[Math.floor(pseudoRand(0, allHeadlines.length, 8))];
    const h3 = allHeadlines[Math.floor(pseudoRand(0, allHeadlines.length, 9))];
    const snapshot = {
        ticker,
        price: parseFloat(basePrice.toFixed(2)),
        volume: currentVol,
        indicators: {
            rsi: parseFloat(rsi.toFixed(2)),
            movingAverageShort: parseFloat(maShort.toFixed(2)),
            movingAverageLong: parseFloat(maLong.toFixed(2)),
            volumeBaseline: volBase,
        },
        newsHeadlines: Array.from(new Set([h1, h2, h3]))
    };
    // ── PARALLEL AGENT EXECUTION ──────────────────────────────────
    // All three independent agents start concurrently.
    // runWithTelemetry captures real timestamps for each.
    // Promise.all here runs all 3 concurrently and collects
    // their telemetry results together.
    const [marketResult, sentimentResult, ragResult] = await Promise.all([
        runWithTelemetry('market_signal_agent', 'Market Signal', runMarketSignalAgent(snapshot)),
        runWithTelemetry('sentiment_intelligence_agent', 'Sentiment', runSentimentAgent(snapshot)),
        runWithTelemetry('fundamental_rag_agent', 'Fundamental RAG', runFundamentalRagAgent(ticker, 'earnings and regulatory reviews'))
    ]);
    // ── ORCHESTRATION END (before synthesis — synthesis is dependent) ──
    const orchestrationEnd = Date.now();
    const totalOrchestrationMs = orchestrationEnd - orchestrationStart;
    // Telemetry for parallel proof:
    // Sum of individual durations will typically exceed totalOrchestrationMs,
    // proving that agents were running concurrently.
    const telemetry = [
        marketResult.telemetry,
        sentimentResult.telemetry,
        ragResult.telemetry
    ];
    const sumAgentDurations = telemetry.reduce((sum, t) => sum + t.durationMs, 0);
    const parallelEfficiencyMs = sumAgentDurations - totalOrchestrationMs;
    // ── SYNTHESIS (only runs after all parallel agents resolve) ───
    const synthesis = await synthesize(marketResult.result, sentimentResult.result, ragResult.result, userProfile);
    const successfulAgents = telemetry.filter(t => t.status === 'success').length;
    const failedAgents = telemetry.filter(t => t.status === 'failed').length;
    const log = {
        sessionId: `sess_${Date.now()}`,
        timestamp: new Date().toISOString(),
        ticker,
        userProfile,
        marketSnapshot: snapshot,
        agentOutputs: {
            marketSignal: marketResult.result,
            sentiment: sentimentResult.result,
            fundamentalRag: ragResult.result
        },
        synthesisOutput: synthesis,
        metrics: {
            telemetry,
            totalOrchestrationMs,
            parallelEfficiencyMs, // Positive value proves parallel overlap
            agentAgreementScore: synthesis.agent_agreement_score,
            dataCoveragePercent: synthesis.data_coverage_percent,
            successfulAgents,
            failedAgents
        }
    };
    return log;
}
async function main() {
    console.log("Initializing Corpus Embeddings...");
    await initializeCorpus();
    console.log("Corpus Initialized.\n");
    const profile = {
        id: 'user_1',
        riskProfile: 'moderate',
        portfolioConstraints: {
            maxExposurePercent: 10
        }
    };
    const ticker = 'RELIANCE';
    console.log(`\n======================================================`);
    console.log(` Starting Kaleidos Multi-Agent Session for ${ticker}`);
    console.log(`======================================================\n`);
    const log = await runSession(ticker, profile);
    console.log(`[USER PROFILE]: ${log.userProfile.riskProfile.toUpperCase()}`);
    console.log(`[MARKET PRICE]: $${log.marketSnapshot.price}\n`);
    console.log(`--- SPECIALIST AGENT OUTPUTS ---`);
    console.log(`📡 Market Signal Agent: ${log.agentOutputs.marketSignal?.signal.toUpperCase()} (Confidence: ${log.agentOutputs.marketSignal?.confidence})`);
    console.log(`   └> ${log.agentOutputs.marketSignal?.analysis_summary}`);
    console.log(`🧠 Sentiment Agent: ${log.agentOutputs.sentiment?.signal.toUpperCase()} (Confidence: ${log.agentOutputs.sentiment?.confidence})`);
    console.log(`   └> ${log.agentOutputs.sentiment?.analysis_summary}`);
    console.log(`📑 Fundamental RAG Agent: ${log.agentOutputs.fundamentalRag?.signal.toUpperCase()} (Confidence: ${log.agentOutputs.fundamentalRag?.confidence})`);
    console.log(`   └> ${log.agentOutputs.fundamentalRag?.analysis_summary}\n`);
    console.log(`--- EXECUTION TELEMETRY ---`);
    log.metrics.telemetry.forEach(t => {
        console.log(`  ${t.displayName}: ${t.durationMs}ms [${t.status}]`);
    });
    console.log(`  Total Orchestration: ${log.metrics.totalOrchestrationMs}ms`);
    console.log(`  Parallel Savings: ${log.metrics.parallelEfficiencyMs}ms\n`);
    console.log(`--- SYNTHESIS & RECOMMENDATION ---`);
    console.log(`🤝 Agent Agreement Score: ${log.synthesisOutput.agent_agreement_score}`);
    if (log.synthesisOutput.conflicts_detected.length > 0) {
        console.log(`⚠️  Conflicts Detected: ${log.synthesisOutput.conflicts_detected.join(', ')}`);
    }
    console.log(`🛡️  Constraints Applied: ${log.synthesisOutput.constraints_applied.join(', ')}`);
    console.log(`\n=> BASE RECOMMENDATION: ${log.synthesisOutput.base_recommendation.toUpperCase()}`);
    console.log(`=> PERSONALIZED VERDICT: ${log.synthesisOutput.recommendation.toUpperCase()} (Confidence: ${log.synthesisOutput.confidence})`);
    console.log(`=> PERSONALIZATION: ${log.synthesisOutput.personalization_effect}\n`);
    console.log(`======================================================`);
    console.log(` 🔮 COUNTERFACTUAL DEMO (WOW FACTOR)`);
    console.log(`======================================================\n`);
    console.log(`Q: "What if I were an AGGRESSIVE investor?"`);
    const diffAggressive = await runCounterfactual(log.agentOutputs.marketSignal, log.agentOutputs.sentiment, log.agentOutputs.fundamentalRag, profile, 'aggressive');
    console.log(`A: ${diffAggressive.delta_explanation}\n`);
    console.log(`Q: "What if I were a CONSERVATIVE investor?"`);
    const diffConservative = await runCounterfactual(log.agentOutputs.marketSignal, log.agentOutputs.sentiment, log.agentOutputs.fundamentalRag, profile, 'conservative');
    console.log(`A: ${diffConservative.delta_explanation}\n`);
}
// main().catch(console.error);
