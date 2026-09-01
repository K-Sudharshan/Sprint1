export type SignalType = 'bullish' | 'bearish' | 'neutral' | 'positive' | 'negative' | 'mixed' | 'supportive' | 'cautionary' | 'no_relevant_source_found';
export type RecommendationType = 'buy' | 'add' | 'hold' | 'reduce' | 'avoid';
export type RiskProfileLevel = 'conservative' | 'moderate' | 'aggressive';

export interface MarketSnapshot {
  ticker: string;
  price: number;
  volume: number;
  indicators: {
    rsi: number;
    movingAverageShort: number;
    movingAverageLong: number;
    volumeBaseline: number;
  };
  newsHeadlines: string[];
}

export interface UserProfile {
  id: string;
  riskProfile: RiskProfileLevel;
  portfolioConstraints: {
    maxExposurePercent: number;
  };
}

export interface BaseAgentOutput {
  agent_name: string;
  analysis_summary: string;
  confidence: number;
  risk_factors: string[];
  data_sources: string[];
  citations: string[];
  uncertainty: string;
  timestamp: string;
}

export interface MarketSignalOutput extends BaseAgentOutput {
  agent_name: 'market_signal_agent';
  signal: 'bullish' | 'bearish' | 'neutral';
  dimensions: {
    price_momentum: { label: string; score: number };
    volume_anomaly: { label: string; score: number };
    trend_technical: { label: string; score: number };
  };
  key_evidence: string[];
}

export interface SentimentOutput extends BaseAgentOutput {
  agent_name: 'sentiment_intelligence_agent';
  signal: 'positive' | 'negative' | 'mixed';
  key_evidence: string[];
  sentiment_conflict_detected: boolean;
}

export interface RetrievedFact {
  claim: string;
  citation: string;
}

export interface FundamentalRagOutput extends BaseAgentOutput {
  agent_name: 'fundamental_rag_agent';
  signal: 'supportive' | 'cautionary' | 'neutral' | 'no_relevant_source_found';
  retrieved_facts: RetrievedFact[];
  inferred_conclusions: string[];
}

// Actual measured telemetry for one agent execution
export interface AgentTelemetry {
  agentName: string;
  displayName: string;
  startTime: number;      // Date.now() at invocation
  endTime: number;        // Date.now() after resolution or rejection
  durationMs: number;     // endTime - startTime
  status: 'success' | 'failed';
  error?: string;
}

export interface SynthesisOutput {
  agent_name: 'synthesis_investment_intelligence_agent';
  analysis_summary: string;
  recommendation: RecommendationType;
  confidence: number;
  agent_agreement_score: number;
  conflicts_detected: string[];
  active_risk_profile: RiskProfileLevel;
  constraints_applied: string[];
  contributing_agents: string[];
  explanation: string;
  uncertainty: string;
  timestamp: string;
  // Personalization fields
  base_recommendation: RecommendationType;   // pre-risk-policy recommendation
  personalization_effect: string;             // human-readable explanation of how profile changed the outcome
  // Data coverage
  data_coverage_percent: number;             // 0–100, dynamically calculated
  available_agent_count: number;
  total_agent_count: number;
  missing_data_impact: string;
}

export interface SessionLog {
  sessionId: string;
  timestamp: string;
  ticker: string;
  userProfile: UserProfile;
  marketSnapshot: MarketSnapshot;
  agentOutputs: {
    marketSignal: MarketSignalOutput | null;
    sentiment: SentimentOutput | null;
    fundamentalRag: FundamentalRagOutput | null;
  };
  synthesisOutput: SynthesisOutput;
  metrics: {
    // Real measured telemetry — no fakes
    telemetry: AgentTelemetry[];
    totalOrchestrationMs: number;
    parallelEfficiencyMs: number;   // sum(agent durations) - total orchestration
    agentAgreementScore: number;
    dataCoveragePercent: number;
    successfulAgents: number;
    failedAgents: number;
  };
}



