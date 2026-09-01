# 1. Architecture Overview

Kaleidos is a four-agent system: three independent **specialist agents** (Market Signal, Sentiment Intelligence, Fundamental & RAG) analyze the same market event in parallel using different data and different reasoning criteria, and one **Synthesis / Investment Intelligence Agent** consumes their structured outputs, resolves agreement and disagreement, applies a user's risk profile, and produces one explainable, personalized recommendation. A lightweight **Profiling Layer** sits inside the Synthesis Agent's decision step and is the single point where identical market inputs diverge into different outputs per investor — this same seam is replayed to power the counterfactual "what if I had a different risk profile" capability. The architecture is intentionally small: four agents, one shared evidence cache, one synthesis step, no distributed infrastructure — built to be a credible vertical slice in 5 hours rather than a scaled system.

---

# 2. System Design Principles

1. **Independence before synthesis** — every specialist agent must be able to produce a useful, standalone output even if the others fail or are never called.
2. **Evidence is generated once, interpreted many times** — market/sentiment/fundamental evidence is profile-agnostic and cached; only the Synthesis Agent's decision step is profile-aware. This is what makes personalization auditable and the counterfactual engine cheap.
3. **No uncited claims** — anything presented as fact must carry a data source or document citation; anything without one is explicitly labeled as inference or flagged as missing.
4. **Conflict is signal, not noise** — disagreement between agents is surfaced to the user, never silently averaged away.
5. **Fail loud, not wrong** — a missing feed, empty retrieval, or agent timeout must degrade the confidence and scope of the output, never fabricate a substitute.
6. **Structured contracts over free text** — every agent returns a fixed-shape object; the Synthesis Agent never parses prose to make decisions.
7. **Small and legible** — four agents, one synthesis step, one shared cache. No message queues, no microservices, no agent-to-agent chatter.

---

# 3. High-Level Agent Architecture

```
                              ┌─────────────────────────┐
                              │      Market Snapshot     │
                              │ (price/volume/indicators,│
                              │  news feed, doc corpus)  │
                              └────────────┬─────────────┘
                                           │
                     ┌─────────────────────┼─────────────────────┐
                     │                     │                     │
                     ▼                     ▼                     ▼
          ┌────────────────────┐ ┌──────────────────────┐ ┌───────────────────────┐
          │  Market Signal      │ │ Sentiment             │ │ Fundamental & RAG      │
          │  Agent               │ │ Intelligence Agent    │ │ Agent                  │
          │  (technical,         │ │ (news/social tone,    │ │ (retrieval-grounded    │
          │   momentum, volume)  │ │  conflicting signals) │ │  filings/transcripts)  │
          └──────────┬──────────┘ └──────────┬────────────┘ └───────────┬────────────┘
                     │                        │                          │
                     │   structured output    │    structured output     │  structured output
                     │   contract              │    contract               │  contract (w/ citations)
                     └─────────────┬───────────┴─────────────┬────────────┘
                                   ▼                          ▼
                         ┌────────────────────────────────────────┐
                         │     Conflict Detection & Confidence      │
                         │             (inside Synthesis)           │
                         └────────────────────┬─────────────────────┘
                                              ▼
                         ┌────────────────────────────────────────┐
                         │   Risk Personalization Layer             │
                         │   (Conservative / Moderate / Aggressive) │
                         └────────────────────┬─────────────────────┘
                                              ▼
                         ┌────────────────────────────────────────┐
                         │  Synthesis / Investment Intelligence     │
                         │  Agent → Final Recommendation            │
                         └────────────────────┬─────────────────────┘
                                              ▼
                              ┌───────────────────────────┐
                              │   Live Interface / Session  │
                              │   Log / Reasoning Trace     │
                              └───────────────────────────┘

     Counterfactual path: cached Signal/Sentiment/Fundamental outputs
     re-enter the Risk Personalization Layer under a different profile
     without re-invoking the three specialist agents.
```

---

# 4. Agent Definitions

### 4.1 Market Signal Agent
- **Role:** Independent technical analyst.
- **Primary responsibility:** Classify the ticker's technical posture across multiple independent dimensions — price momentum, volume anomaly, and trend/technical-indicator state.
- **Inputs:** Recent price series, volume series, computed technical indicators (e.g. moving averages, RSI-style momentum) for the selected ticker.
- **Processing logic:** Deterministic/statistical scoring per dimension (e.g. momentum = short-vs-long moving average delta; volume anomaly = current volume z-score against a rolling baseline), then a lightweight reasoning pass that turns the scored dimensions into a labeled classification with a rationale.
- **Outputs:** Per-dimension classification labels, an overall technical signal, confidence, and cited data points (see §6.1).
- **Independence:** Uses only numerical market data — no news text, no filings — so its verdict cannot be contaminated by sentiment or fundamental framing.

### 4.2 Sentiment Intelligence Agent
- **Role:** Independent behavioral/news analyst.
- **Primary responsibility:** Assess prevailing market/news sentiment, distinguish positive from negative signal sources, and explicitly detect internal disagreement within sentiment data itself (e.g. bullish headlines vs. bearish social chatter).
- **Inputs:** A set of recent news headlines/snippets and/or social signal samples (synthetic/simulated for the MVP) for the selected ticker.
- **Processing logic:** Classifies each input item's polarity, aggregates into an overall sentiment score, and separately reports the *spread* of polarity across items so uncertainty isn't hidden inside an averaged score.
- **Outputs:** Aggregate sentiment label, confidence, notable positive/negative excerpts, and an explicit "sentiment conflict" flag when the underlying items disagree.
- **Independence:** Operates purely on text/behavioral inputs — never touches price data or filings — so its conclusion reflects narrative, not price action.

### 4.3 Fundamental & RAG Agent
- **Role:** Independent grounded researcher.
- **Primary responsibility:** Retrieve and cite relevant chunks from the regulatory/financial document corpus and produce a fundamental verdict strictly tied to retrieved evidence.
- **Inputs:** A semantic query derived from the ticker/session context; a vector index over the document corpus (SEBI-style filings, earnings transcript excerpts, or synthetic equivalents).
- **Processing logic:** Embed the query, retrieve top-k relevant chunks, generate a verdict *only* from retrieved content, and explicitly tag each claim as either "retrieved fact" (has a citation) or "inferred conclusion" (derived from but not directly stated in the source).
- **Outputs:** Verdict, confidence, retrieved chunk citations (document + excerpt), and a distinct list separating retrieved facts from inferred conclusions.
- **Independence:** The only agent with access to the document corpus; produces no verdict at all if retrieval returns nothing relevant (see §12), rather than falling back to general knowledge.

### 4.4 Synthesis / Investment Intelligence Agent
- **Role:** Independent decision-maker and personalizer — not a fourth "opinion," but the consumer of the other three.
- **Primary responsibility:** Combine the three specialist contracts, detect agreement/disagreement, apply the active user's risk profile and portfolio constraints, and produce one explainable, personalized recommendation.
- **Inputs:** The three specialist output contracts, the user's stored risk profile and portfolio state.
- **Processing logic:** See §10 (conflict resolution) and §11 (synthesis engine).
- **Outputs:** Final recommendation, confidence, explanation, active constraints, and full attribution back to the specialist agents that informed it.
- **Independence:** Never generates new evidence — it only interprets what the specialists already produced, which is what keeps its personalization auditable.

---

# 5. Parallel Execution Model

- On session start (ticker selection), the orchestrator dispatches the Market Signal, Sentiment Intelligence, and Fundamental & RAG agents **concurrently** (async calls / parallel tasks) against the same market snapshot — no agent waits on another.
- Each agent runs against its own data slice and returns independently; there is no cross-agent messaging during execution, preserving independence.
- The orchestrator collects results with a per-agent timeout. As each contract arrives it is written to a shared **evidence cache** keyed by session ID.
- Once all three contracts are present (or timed out — see §12.3), the orchestrator invokes the Synthesis Agent exactly once with the complete evidence set.
- For the counterfactual flow, the orchestrator skips re-dispatching the three specialists entirely and re-invokes only the Synthesis Agent's personalization step, reading the same cached evidence under a different profile.

---

# 6. Agent Output Contracts

### 6.1 Market Signal Agent — Output Contract
```json
{
  "agent_name": "market_signal_agent",
  "analysis_summary": "string",
  "signal": "bullish | bearish | neutral",
  "dimensions": {
    "price_momentum": {"label": "string", "score": "float"},
    "volume_anomaly": {"label": "string", "score": "float"},
    "trend_technical": {"label": "string", "score": "float"}
  },
  "confidence": "float (0-1)",
  "key_evidence": ["string"],
  "risk_factors": ["string"],
  "data_sources": ["string"],
  "citations": ["string (data point references)"],
  "uncertainty": "string",
  "timestamp": "ISO-8601"
}
```

### 6.2 Sentiment Intelligence Agent — Output Contract
```json
{
  "agent_name": "sentiment_intelligence_agent",
  "analysis_summary": "string",
  "signal": "positive | negative | mixed",
  "confidence": "float (0-1)",
  "key_evidence": ["string (representative headlines/snippets)"],
  "sentiment_conflict_detected": "boolean",
  "risk_factors": ["string"],
  "data_sources": ["string"],
  "citations": ["string (source references)"],
  "uncertainty": "string",
  "timestamp": "ISO-8601"
}
```

### 6.3 Fundamental & RAG Agent — Output Contract
```json
{
  "agent_name": "fundamental_rag_agent",
  "analysis_summary": "string",
  "signal": "supportive | cautionary | neutral | no_relevant_source_found",
  "confidence": "float (0-1)",
  "retrieved_facts": [
    {"claim": "string", "citation": "document + chunk reference"}
  ],
  "inferred_conclusions": ["string"],
  "risk_factors": ["string"],
  "data_sources": ["string"],
  "citations": ["string"],
  "uncertainty": "string",
  "timestamp": "ISO-8601"
}
```

### 6.4 Synthesis Agent — Output Contract
```json
{
  "agent_name": "synthesis_investment_intelligence_agent",
  "analysis_summary": "string",
  "recommendation": "buy | add | hold | reduce | avoid",
  "confidence": "float (0-1)",
  "agent_agreement_score": "float (0-1)",
  "conflicts_detected": ["string"],
  "active_risk_profile": "conservative | moderate | aggressive",
  "constraints_applied": ["string"],
  "contributing_agents": ["market_signal_agent", "sentiment_intelligence_agent", "fundamental_rag_agent"],
  "explanation": "string",
  "uncertainty": "string",
  "timestamp": "ISO-8601"
}
```

---

# 7. RAG and Evidence Grounding Architecture

- **Corpus:** A small curated set of SEBI-style filings / earnings transcript excerpts (real or synthetic equivalents), chunked into short passages at ingestion time.
- **Indexing:** Each chunk is embedded and stored in a lightweight vector index (in-memory or a minimal vector DB) alongside its source document ID and position.
- **Retrieval:** Given a ticker/session context, the Fundamental & RAG Agent embeds a query and retrieves the top-k most relevant chunks by similarity.
- **Context selection:** Only retrieved chunks above a minimum relevance threshold are passed to the generation step; chunks below threshold are discarded rather than used as weak evidence.
- **Attribution:** Every claim in the agent's output that stems from a retrieved chunk is paired with a citation (document name + chunk excerpt), stored in `retrieved_facts`.
- **Fact vs. inference separation:** The agent is explicitly instructed to separate direct restatements of retrieved content (`retrieved_facts`) from any conclusion it draws beyond the literal text (`inferred_conclusions`), so the UI can visually and logically distinguish "the filing says X" from "this suggests Y."
- **No-match handling:** If retrieval returns nothing above threshold, the agent emits `signal: "no_relevant_source_found"` and `confidence: 0` rather than generating an ungrounded claim (see §12.2).

---

# 8. Personalization and Risk Intelligence Layer

The Personalization Layer is a distinct step *inside* the Synthesis Agent's execution — it runs after conflict detection and before the final recommendation is written.

| Profile | Risk Tolerance | Max Exposure per Position | Volatility Sensitivity | Investment Horizon | Concentration Limit |
|---|---|---|---|---|---|
| **Conservative** | Low | Small (e.g. ≤5% of portfolio) | High — volatility strongly discounts a bullish signal | Long-term | Low — diversification enforced |
| **Moderate** | Medium | Medium (e.g. ≤10%) | Moderate — volatility partially discounts signal | Medium-term | Medium |
| **Aggressive** | High | Large (e.g. ≤20%) | Low — volatility barely discounts signal | Short-to-medium term | Higher concentration tolerated |

**Where personalization occurs:**
1. **Reweighting:** The raw agent-agreement score and individual signal strengths are multiplied by profile-specific weights (e.g. momentum signal weight is higher for Aggressive, lower for Conservative).
2. **Constraint gating:** Profile-specific exposure and concentration limits are checked against the current portfolio; a recommendation that would breach a Conservative investor's constraint is automatically downgraded (e.g. Buy → Hold) even if the raw synthesis was positive.
3. **Confidence framing:** Volatility sensitivity adjusts how much a high-volatility signal reduces stated confidence — sharply for Conservative, minimally for Aggressive.

This is the *only* place in the pipeline where the user's identity affects the outcome — the three specialist agents never see the risk profile, which is what keeps personalization transparent and replayable.

---

# 9. Counterfactual Intelligence Engine

**Mechanism:** Because specialist-agent evidence is cached per session and is profile-agnostic (§2, principle 2), a counterfactual query never re-runs the Market Signal, Sentiment, or Fundamental & RAG agents. It re-runs only the Personalization Layer (§8) inside the Synthesis Agent, once per requested profile.

**What stays constant:** The three specialist contracts — signals, confidence scores, citations, evidence — are read from the evidence cache unchanged.

**What changes:** Profile-specific weights, exposure/concentration constraints, and volatility discounting (§8) — which can change the `agent_agreement_score` interpretation, which constraints in `constraints_applied` fire, and the final `recommendation` field.

**Output:** A diff object comparing two Synthesis Agent runs:
```json
{
  "unchanged": ["market_signal_agent output", "sentiment_intelligence_agent output", "fundamental_rag_agent output"],
  "profile_a": {"profile": "moderate", "recommendation": "hold", "constraints_applied": ["volatility_discount_medium"]},
  "profile_b": {"profile": "aggressive", "recommendation": "add", "constraints_applied": ["max_exposure_20pct"]},
  "delta_explanation": "string — names the specific constraint/weight that changed the outcome"
}
```

**Why recommendations differ:** The `delta_explanation` field always names a specific, traceable mechanism (a weight change or a constraint activation/deactivation) — never "the AI decided differently" — because the underlying evidence is provably identical between the two runs.

---

# 10. Conflict Resolution Framework

**Detection:** After collecting all three specialist contracts, the Synthesis Agent computes pairwise agreement between `signal` fields (e.g. Market Signal: bullish, Sentiment: negative, Fundamental: neutral → disagreement detected between Market and Sentiment).

**Confidence measurement:** An `agent_agreement_score` (0–1) is computed from how many of the three agents point the same direction, weighted by each agent's own stated confidence — high individual confidence with low cross-agent agreement produces a *lower* overall score than the same confidence with agreement.

**Surfacing conflicts:** Any pairwise disagreement is written into `conflicts_detected` on the Synthesis output in plain language (e.g. "Technical signal is bullish while sentiment is bearish — momentum may be running ahead of narrative").

**Certainty adjustment:** The final recommendation's `confidence` is capped by the `agent_agreement_score` — the synthesis can never report high confidence when the specialists disagree, regardless of how confident any single agent is.

**Cautious recommendation rule:** When conflict is detected and no single specialist's confidence exceeds a set threshold, the Synthesis Agent defaults toward a neutral/cautious recommendation (e.g. Hold) rather than picking a side, and states explicitly that the caution stems from unresolved disagreement.

---

# 11. Synthesis and Recommendation Engine

Given the three specialist contracts, the Synthesis Agent executes, in order:
1. **Contract validation** — confirm all three (or fewer, if degraded) contracts are present and well-formed.
2. **Conflict detection** — run §10, producing `agent_agreement_score` and `conflicts_detected`.
3. **Personalization** — run §8 against the active profile, producing reweighted signal strength and applied constraints.
4. **Recommendation selection** — map the reweighted, constraint-checked signal onto a recommendation label (buy/add/hold/reduce/avoid) via a fixed decision rule (not a black box): strong agreement + profile-cleared constraints → directional recommendation; conflict or constraint breach → hold/reduce.
5. **Explanation generation** — construct `explanation` from the concrete inputs used (which agents agreed, which constraint mattered, what evidence was cited) rather than a generic summary.
6. **Attribution** — populate `contributing_agents` and retain links back to each specialist's citations so the user can drill from the final recommendation back to raw evidence.

---

# 12. Degraded Data and Failure Handling

### 12.1 Market data unavailable
The Market Signal Agent returns `signal: null`, `confidence: 0`, `uncertainty: "market_data_unavailable"`. The Synthesis Agent excludes the technical dimension from `agent_agreement_score`, lowers overall confidence, and states in `explanation` that the recommendation is based on sentiment/fundamental signals only.

### 12.2 Relevant filing/document unavailable
The Fundamental & RAG Agent returns `signal: "no_relevant_source_found"`, `confidence: 0`, empty `retrieved_facts`. The Synthesis Agent proceeds with the remaining two agents, flags the missing dimension in the UI, and reduces confidence accordingly — no fundamental claim is fabricated to fill the gap.

### 12.3 One agent fails or times out
The orchestrator enforces a per-agent timeout; a non-responding agent is marked `status: "timed_out"` in the evidence cache and excluded from synthesis, identically to §12.1/12.2 — the pipeline continues with the remaining agents rather than blocking the session.

### 12.4 Two agents strongly conflicting
Handled by §10: the Synthesis Agent surfaces the conflict explicitly in `conflicts_detected`, caps confidence via `agent_agreement_score`, and defaults to a cautious recommendation (Hold) rather than arbitrarily picking one agent's side.

**Common rule across all four cases:** the system never presents a recommendation without disclosing which inputs were missing, timed out, or conflicting — degraded state is always visible in the output contract, never hidden.

---

# 13. Reasoning Trace and Explainability

Every session produces a linear, inspectable trace:

```text
Raw Input               → ticker, user profile, timestamp
    ↓
Data Retrieval           → market snapshot fetched, corpus queried, sentiment sampled
    ↓
Parallel Agent Analysis  → 3 agents dispatched concurrently
    ↓
Agent Outputs            → 3 structured contracts logged verbatim
    ↓
Conflict Detection        → agreement score + flagged conflicts logged
    ↓
Risk Personalization      → active profile, weights applied, constraints checked
    ↓
Synthesis                → recommendation, confidence, explanation
    ↓
Final Recommendation      → rendered to user with full attribution
```

Each stage's logged object is retained and linkable from the UI, so a judge (or user) can click the final recommendation and walk backward to the exact agent output, citation, or constraint that produced it — nothing in the final answer is untraceable to a stage above it.

---

# 14. Metrics and Observability

Logged per session (minimum three, per problem statement — five defined here for credibility):

1. **Agent response latency** — ms per specialist agent and total time-to-recommendation.
2. **Agent agreement/disagreement score** — the `agent_agreement_score` computed at synthesis (§10).
3. **Portfolio risk concentration score** — Herfindahl-style concentration measure of the user's current watchlist/portfolio.
4. **Signal confidence distribution** — the confidence values reported by each specialist agent, for calibration review.
5. **Retrieval relevance** — average similarity score of chunks actually used by the Fundamental & RAG Agent, as a proxy for RAG quality.

All metrics are written to a session-keyed log at the end of each pipeline run, alongside the active risk profile, so downstream review can correlate metrics with profile and market conditions.

---

# 15. End-to-End Data Flow

1. User selects a ticker; session starts with the user's stored (or default) risk profile.
2. Orchestrator fetches the market snapshot and dispatches the three specialist agents in parallel.
3. Market Signal Agent scores momentum/volume/trend from price data and returns its contract.
4. Sentiment Intelligence Agent scores headline/social polarity and flags internal conflict if present, returns its contract.
5. Fundamental & RAG Agent retrieves relevant document chunks, grounds its verdict, separates fact from inference, returns its contract.
6. Orchestrator confirms all three contracts (or logs degraded status per §12) and invokes the Synthesis Agent once.
7. Synthesis Agent detects conflict, computes agreement score, applies the active risk profile's weights/constraints, and produces the final recommendation with explanation and attribution.
8. The interface renders signals, synthesized recommendation, and portfolio state; the reasoning trace and metrics are persisted.
9. (Counterfactual) User requests an alternate profile; orchestrator re-invokes only the Synthesis Agent's personalization step against the cached evidence, and the UI renders the diff (§9).

---

# 16. Hackathon Implementation Strategy

### Must Build
- The three specialist agents with real (even if simple) processing logic — not stubs: real momentum/volume math for Market Signal, real polarity scoring for Sentiment, real vector retrieval + citation for Fundamental & RAG.
- The Synthesis Agent with genuine conflict detection, confidence capping, and rule-based recommendation selection.
- The Personalization Layer with at least the three defined profiles and at least one reweighting mechanism plus one hard constraint.
- The evidence cache that makes the counterfactual replay real (not re-running specialists with a different prompt).
- One scripted degraded-data path (recommend §12.2 — easiest to trigger reliably in a demo).
- The reasoning trace log (even as structured JSON/log lines, before any visualization).
- The three-plus session metrics logged per run.

### Simplified Implementation
- Market data feed can be a small static/replayed dataset for 3–5 demo tickers rather than a live exchange connection.
- Document corpus can be a handful of synthetic filing/transcript snippets rather than a full SEBI archive.
- Sentiment inputs can be a curated synthetic set of headlines/snippets rather than a live news/social scraper.
- Vector index can be an in-memory embedding store rather than a hosted vector database.
- User profiles/portfolio can be 2–3 pre-seeded demo users rather than a full account system.

### Future Architecture
- Live exchange data integration and streaming updates.
- Full-scale SEBI filing ingestion pipeline with scheduled refresh.
- Real-time news/social scraping and NLP sentiment pipeline at scale.
- Hosted, horizontally-scaled vector database with production RAG re-ranking.
- Multi-user account system with authentication and persistent long-term behavioral modeling.
- Backtesting infrastructure for true 30-day forward-return signal accuracy tracking.
- Production-grade orchestration (queues, retries-with-backoff at scale, distributed tracing).

---

# 17. Requirement Mapping

| # | Official Minimum Requirement | Architecture Component |
|---|---|---|
| 1 | Signal classification across ≥3 independent dimensions, stated confidence, cited reasoning | §4.1 / §6.1 Market Signal Agent (`dimensions` object, `confidence`, `citations`) |
| 2 | RAG component grounding ≥1 agent output in retrieved material, visible attribution | §4.3 / §6.3 / §7 Fundamental & RAG Agent (`retrieved_facts` with citations) |
| 3 | ≥3 specialized agents executing in parallel, defined roles, structured output contract consumed by synthesis layer | §3 diagram, §4 (all agents), §5 Parallel Execution Model, §6 contracts |
| 4 | User profiling that demonstrably changes outputs on identical market inputs | §8 Personalization Layer, §9 Counterfactual Intelligence Engine |
| 5 | Live interface rendering signals, synthesized output with attribution, portfolio/watchlist state | §13 Reasoning Trace feeding the interface (interface itself defined in PRODUCT_SPEC.md) |
| 6 | Performance log with ≥3 measurable session metrics | §14 Metrics and Observability |
| 7 | ≥1 end-to-end demo scenario, raw data → multi-agent reasoning → recommendation, full reasoning chain visible | §15 End-to-End Data Flow, §13 Reasoning Trace |
| 8 | Graceful handling of ≥1 degraded-data scenario without pipeline failure or uncited output | §12 Degraded Data and Failure Handling (all four cases) |
| 9 | Written summary of agent architecture and decision logic for judges | This document in full, particularly §4, §10, §11 |
