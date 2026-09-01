import { 
  MarketSignalOutput, 
  SentimentOutput, 
  FundamentalRagOutput, 
  UserProfile, 
  SynthesisOutput,
  RecommendationType,
  RiskProfileLevel
} from '../types/models';

// ──────────────────────────────────────────────────────────────
//  DETERMINISTIC RISK POLICY LAYER
//  These thresholds are explicit, traceable, and deterministic.
//  They are NOT hardcoded recommendations — they are the rules
//  under which recommendations are constrained.
// ──────────────────────────────────────────────────────────────
interface RiskPolicy {
  minBuyConfidence: number;    // Min synthesis confidence required to issue BUY
  minAddConfidence: number;    // Min synthesis confidence required to issue ADD
  conflictTolerance: boolean;  // If false, any conflict forces HOLD regardless of score
  downsideWeight: number;      // Multiplier applied to negative signals (>1 = more cautious)
  upsideWeight: number;        // Multiplier applied to positive signals
  label: string;               // Human-readable policy label
}

const RISK_POLICY: Record<RiskProfileLevel, RiskPolicy> = {
  conservative: {
    minBuyConfidence: 0.72,   // High threshold: needs strong conviction
    minAddConfidence: 0.55,
    conflictTolerance: false, // Any conflict → forced HOLD
    downsideWeight: 1.4,      // Downside amplified: bears more weight
    upsideWeight: 0.8,        // Upside discounted
    label: 'Conservative'
  },
  moderate: {
    minBuyConfidence: 0.55,   // Balanced threshold
    minAddConfidence: 0.40,
    conflictTolerance: true,  // Can tolerate mild conflicts
    downsideWeight: 1.0,      // Symmetric weighting
    upsideWeight: 1.0,
    label: 'Moderate'
  },
  aggressive: {
    minBuyConfidence: 0.40,   // Low threshold: acts on signals early
    minAddConfidence: 0.28,
    conflictTolerance: true,  // High tolerance for uncertainty
    downsideWeight: 0.8,      // Downside discounted
    upsideWeight: 1.3,        // Upside amplified
    label: 'Aggressive'
  }
};

/**
 * Calculates the raw recommendation from a net score, without any risk policy applied.
 * This is the "base" result that we then filter through the investor profile.
 */
function calcRawRecommendation(netScore: number): RecommendationType {
  if (netScore > 0.8) return 'buy';
  if (netScore > 0.3) return 'add';
  if (netScore < -0.8) return 'avoid';
  if (netScore < -0.3) return 'reduce';
  return 'hold';
}

export async function synthesize(
  marketOutput: MarketSignalOutput | null,
  sentimentOutput: SentimentOutput | null,
  ragOutput: FundamentalRagOutput | null,
  userProfile: UserProfile
): Promise<SynthesisOutput> {
  const timestamp = new Date().toISOString();
  const policy = RISK_POLICY[userProfile.riskProfile];
  
  // ── 1. Map signals to numeric values ──────────────────────────
  const signalMap: Record<string, number> = {
    bullish: 1, bearish: -1, neutral: 0,
    positive: 1, negative: -1, mixed: 0,
    supportive: 1, cautionary: -1, no_relevant_source_found: 0
  };

  const marketVal = marketOutput?.signal ? (signalMap[marketOutput.signal] ?? 0) : 0;
  const sentimentVal = sentimentOutput?.signal ? (signalMap[sentimentOutput.signal] ?? 0) : 0;
  const ragVal = ragOutput?.signal ? (signalMap[ragOutput.signal] ?? 0) : 0;

  // ── 2. Data Coverage ───────────────────────────────────────────
  const totalAgents = 3;
  const availableAgents = [marketOutput, sentimentOutput, ragOutput].filter(Boolean).length;
  const dataCoveragePercent = Math.round((availableAgents / totalAgents) * 100);

  // ── 3. Conflict Detection ──────────────────────────────────────
  const signals = [marketVal, sentimentVal, ragVal];
  const hasPositive = signals.some(s => s > 0);
  const hasNegative = signals.some(s => s < 0);
  
  const conflicts_detected: string[] = [];
  if (hasPositive && hasNegative) {
    conflicts_detected.push('Disagreement detected between agent signals (bullish vs bearish indicators).');
  }
  if (ragOutput?.signal === 'no_relevant_source_found') {
    conflicts_detected.push('Missing fundamental/regulatory data — relying on technical/sentiment signals only.');
  }

  // ── 4. Confidence Calculation (weighted by agent confidence) ───
  const mConf = marketOutput?.confidence ?? 0;
  const sConf = sentimentOutput?.confidence ?? 0;
  const rConf = ragOutput?.confidence ?? 0;
  const totalWeight = mConf + sConf + rConf;

  // Apply profile-specific up/down weighting to the raw net score
  const weightedMarket = marketVal * mConf * (marketVal > 0 ? policy.upsideWeight : policy.downsideWeight);
  const weightedSentiment = sentimentVal * sConf * (sentimentVal > 0 ? policy.upsideWeight : policy.downsideWeight);
  const weightedRag = ragVal * rConf * (ragVal > 0 ? policy.upsideWeight : policy.downsideWeight);

  const netScore = weightedMarket + weightedSentiment + weightedRag;

  // Agreement is higher when signals point the same way
  const agent_agreement_score = totalWeight > 0 ? Math.abs(netScore) / totalWeight : 0;

  // Base synthesis confidence from average agent confidence
  let synthesisConfidence = totalWeight > 0 ? totalWeight / availableAgents : 0;
  
  // Reduce confidence when data is missing
  if (dataCoveragePercent < 100) {
    synthesisConfidence *= (dataCoveragePercent / 100);
  }
  // Cap further if conflicts exist
  if (conflicts_detected.length > 0) {
    synthesisConfidence = Math.min(synthesisConfidence, Math.max(agent_agreement_score, 0.35));
  }

  // ── 5. BASE recommendation (pre-profile) ──────────────────────
  const baseRecommendationScore = (marketVal * mConf) + (sentimentVal * sConf) + (ragVal * rConf);
  const base_recommendation = calcRawRecommendation(baseRecommendationScore);

  // ── 6. Apply Risk Policy to get the FINAL recommendation ──────
  const constraints_applied: string[] = [];
  let recommendation: RecommendationType = calcRawRecommendation(netScore);
  let personalizationChangedOutcome = false;
  const personalizationNotes: string[] = [];

  // Conservative: zero tolerance for conflicts
  if (userProfile.riskProfile === 'conservative' && !policy.conflictTolerance && conflicts_detected.length > 0) {
    recommendation = 'hold';
    constraints_applied.push('conflict_forced_hold');
    personalizationNotes.push('Conservative profile has zero tolerance for conflicting signals — recommendation forced to HOLD.');
    personalizationChangedOutcome = recommendation !== base_recommendation;
  }

  // Apply minimum confidence thresholds
  if ((recommendation === 'buy') && synthesisConfidence < policy.minBuyConfidence) {
    recommendation = 'add'; // downgrade
    constraints_applied.push(`confidence_below_${policy.label.toLowerCase()}_buy_threshold_${(policy.minBuyConfidence * 100).toFixed(0)}pct`);
    personalizationNotes.push(`${policy.label} profile requires ≥${(policy.minBuyConfidence * 100).toFixed(0)}% confidence for BUY. Current confidence (${(synthesisConfidence * 100).toFixed(0)}%) falls below this — downgraded to ADD.`);
    personalizationChangedOutcome = true;
  }
  if ((recommendation === 'add') && synthesisConfidence < policy.minAddConfidence) {
    recommendation = 'hold'; // downgrade
    constraints_applied.push(`confidence_below_${policy.label.toLowerCase()}_add_threshold_${(policy.minAddConfidence * 100).toFixed(0)}pct`);
    personalizationNotes.push(`${policy.label} profile requires ≥${(policy.minAddConfidence * 100).toFixed(0)}% confidence for ADD. Current confidence (${(synthesisConfidence * 100).toFixed(0)}%) falls below this — downgraded to HOLD.`);
    personalizationChangedOutcome = true;
  }

  // Aggressive upside amplification: upgrade HOLD to ADD when net score is meaningfully positive
  if (userProfile.riskProfile === 'aggressive' && recommendation === 'hold' && netScore > 0.15) {
    recommendation = 'add';
    constraints_applied.push('aggressive_upside_amplification');
    personalizationNotes.push(`Aggressive profile amplifies upside signals (${policy.upsideWeight}x multiplier) — upgraded from HOLD to ADD given positive net score.`);
    personalizationChangedOutcome = true;
  }

  // Conservative downgrade: BUY → ADD if recommendation score is borderline
  if (userProfile.riskProfile === 'conservative' && recommendation === 'buy' && netScore < 1.5) {
    recommendation = 'add';
    constraints_applied.push('conservative_borderline_buy_downgrade');
    personalizationNotes.push('Conservative profile treats borderline BUY signals cautiously — downgraded from BUY to ADD to reduce exposure risk.');
    personalizationChangedOutcome = true;
  }

  if (constraints_applied.length === 0) {
    constraints_applied.push(`${policy.label.toLowerCase()}_thresholds_met`);
  }

  // ── 7. Personalization Effect Summary ─────────────────────────
  let personalization_effect: string;
  if (personalizationChangedOutcome) {
    personalization_effect = personalizationNotes.join(' ');
  } else if (personalizationNotes.length > 0) {
    personalization_effect = personalizationNotes.join(' ') + ` Final recommendation (${recommendation.toUpperCase()}) matches the base signal.`;
  } else {
    personalization_effect = `${policy.label} profile constraints were applied. The base intelligence result (${base_recommendation.toUpperCase()}) satisfied all profile thresholds at the current confidence level (${(synthesisConfidence * 100).toFixed(0)}%) — no override was triggered.`;
  }

  // ── 8. Missing Data Impact ────────────────────────────────────
  let missing_data_impact = 'All intelligence sources available.';
  if (dataCoveragePercent < 100) {
    const missing = [
      !marketOutput ? 'Market Signal' : null,
      !sentimentOutput ? 'Sentiment' : null,
      !ragOutput ? 'Fundamental RAG' : null
    ].filter(Boolean).join(', ');
    missing_data_impact = `${missing} data unavailable. Confidence reduced proportionally. Synthesis based on ${availableAgents}/${totalAgents} sources.`;
  }

  // ── 9. Explanation ─────────────────────────────────────────────
  const explanation = [
    `${recommendation.toUpperCase()} recommendation with ${(synthesisConfidence * 100).toFixed(0)}% confidence under ${policy.label} investor profile.`,
    conflicts_detected.length > 0 ? `Caution: ${conflicts_detected[0]}` : '',
    constraints_applied.length > 0 ? `Policy applied: ${constraints_applied.join(', ')}.` : ''
  ].filter(Boolean).join(' ');

  return {
    agent_name: 'synthesis_investment_intelligence_agent',
    analysis_summary: 'Synthesized multi-agent intelligence and applied deterministic risk policy constraints.',
    recommendation,
    confidence: parseFloat(synthesisConfidence.toFixed(2)),
    agent_agreement_score: parseFloat(agent_agreement_score.toFixed(2)),
    conflicts_detected,
    active_risk_profile: userProfile.riskProfile,
    constraints_applied,
    contributing_agents: [
      marketOutput?.agent_name, 
      sentimentOutput?.agent_name, 
      ragOutput?.agent_name
    ].filter(Boolean) as string[],
    explanation,
    uncertainty: conflicts_detected.length > 0 ? 'High' : synthesisConfidence > 0.65 ? 'Low' : 'Moderate',
    timestamp,
    base_recommendation,
    personalization_effect,
    data_coverage_percent: dataCoveragePercent,
    available_agent_count: availableAgents,
    total_agent_count: totalAgents,
    missing_data_impact
  };
}
