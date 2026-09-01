# Product Name

**Kaleidos** — Explainable Multi-Agent Investment Intelligence for Retail Investors

---

# One-Line Pitch

Kaleidos turns public market data, filings, and sentiment into a personalized, fully-cited investment recommendation in under 60 seconds — and shows exactly how the recommendation would change if you were a different kind of investor.

---

# Problem Understanding

India's retail investing problem is not data scarcity — NSE feeds, SEBI filings, FII flows, and options chain data are all public. The failure is in synthesis: no tool coordinates multiple independent research lenses (technical, fundamental/regulatory, sentiment) into a single reasoned, personalized, transparently-justified recommendation the way a hedge fund's parallel analyst desks do for institutional clients. With 130M new Indian retail investors in four years (80% under 30) and 89% of F&O participants losing money, the gap is infrastructural, not informational.

Kaleidos closes that gap by running specialized agents in parallel over the same market event, grounding their claims in retrieved source documents, personalizing the synthesis to the individual investor's risk profile, and exposing the full reasoning chain — confidence, evidence, conflicts, and uncertainty — at every step.

---

# Target Users

- **First-time retail investors** (under 30, mobile-first) who currently rely on price charts and Telegram tips and have no research infrastructure.
- **Self-directed active investors** who want hedge-fund-style multi-lens research without paying for a terminal or analyst desk.
- **Hackathon judges**, evaluated as domain experts assessing technical credibility, explainability, and personalization — treated as a proxy for a retail investor who needs to trust a machine's financial reasoning.

---

# Product Vision

Kaleidos is the retail investor's parallel analyst desk: a coordinated set of AI agents that continuously reason over the same market event from different angles — technical, fundamental/regulatory, and sentiment — and synthesize their findings into a single recommendation that is explicitly shaped by *who is asking*. Every claim Kaleidos makes is traceable to a source, every recommendation states its confidence and its blind spots, and every personalization decision can be explained in terms of the specific risk constraint that drove it. Kaleidos's long-term vision is to be the trust layer between public market data and retail decision-making — not a signal generator, but a reasoning system an investor can interrogate.

---

# Core User Flow

1. User selects a stock (or one is pre-loaded from a watchlist) and lands on the live session view.
2. Signal Classification Agent, Fundamental/Regulatory RAG Agent, and Sentiment Agent run in parallel against the same market snapshot.
3. Each agent returns a structured output: classification/verdict, confidence score, cited evidence, and stated uncertainty.
4. The Synthesis Layer combines the three agent outputs into one recommendation, resolving or flagging conflicts.
5. The User Profiling Layer applies the active investor's stored risk profile to reweight and reshape the synthesized recommendation.
6. The interface renders: signal panel (classified, confidence-labeled), synthesized recommendation (source-attributed), and current portfolio/watchlist state.
7. User asks: *"What would you recommend if I were more aggressive/conservative?"* → Kaleidos replays the synthesis step under a different risk profile and shows a side-by-side counterfactual explanation.
8. Session metrics (latency, concentration score, confidence calibration) log automatically to the performance log.

---

# Core MVP Features

### Feature 1 — Signal Classification Module
- **Purpose:** Convert raw market data into a classified, confidence-scored signal across independent analytical dimensions.
- **User input:** A selected ticker (or default watchlist ticker).
- **System behavior:** The Signal Agent evaluates the ticker across at least three independent dimensions — price momentum, volume anomaly, and volatility/sentiment skew — each scored independently, then combined into a labeled classification (e.g. "Bullish Momentum, Elevated Volume, Neutral Sentiment").
- **Expected output:** A classification label per dimension, an overall confidence score, and a short cited rationale referencing the specific data points (e.g. price delta, volume z-score) that drove the classification.
- **Requirement satisfied:** *Signal classification module across ≥3 independent dimensions with stated confidence and cited reasoning.*

### Feature 2 — Retrieval-Augmented Regulatory/Fundamental Agent
- **Purpose:** Ground at least one agent's output in real retrieved source material rather than model-generated claims.
- **User input:** Same ticker; implicit query such as "any recent filings or disclosures relevant to this stock's risk profile."
- **System behavior:** The agent embeds and semantically searches a document corpus (SEBI filings / earnings transcripts / synthetic equivalents) for chunks relevant to the ticker and current signal, then generates a claim strictly grounded in the retrieved chunks.
- **Expected output:** A fundamental/regulatory verdict with inline citations pointing to the exact retrieved document and chunk, visible to the user on hover or expand.
- **Requirement satisfied:** *RAG component grounding at least one agent output in retrieved source material with visible attribution.*

### Feature 3 — Multi-Agent Parallel Architecture
- **Purpose:** Run independent specialized agents concurrently and synthesize their structured outputs into one coherent recommendation.
- **User input:** None beyond ticker selection — this runs automatically per session.
- **System behavior:** Signal Agent, RAG/Fundamental Agent, and Sentiment Agent execute in parallel, each emitting a structured JSON-like output contract (verdict, confidence, evidence, uncertainty). The Synthesis Agent consumes all three contracts, resolves agreement/disagreement, and produces one recommendation.
- **Expected output:** A synthesized recommendation with a visible breakdown of which agent contributed what, and how their outputs were weighted.
- **Requirement satisfied:** *Multi-agent architecture with ≥3 specialized parallel agents, defined roles, and a structured output contract consumed by a synthesis layer.*

### Feature 4 — User Profiling & Personalization Layer
- **Purpose:** Demonstrably change the final recommendation based on stored individual risk parameters, using identical market inputs.
- **User input:** A risk profile (Conservative / Moderate / Aggressive), portfolio composition, and any stored behavioral history (e.g. past overrides of recommendations).
- **System behavior:** The Profiling Layer sits between the Synthesis Layer and the final output. It reweights agent conclusions (e.g. discounting momentum signals for a Conservative profile, upweighting them for Aggressive) and applies risk constraints (position sizing limits, volatility tolerance) before finalizing the recommendation.
- **Expected output:** A personalized recommendation plus a explicit statement of which constraint(s) altered the outcome relative to the raw synthesis.
- **Requirement satisfied:** *User profiling component that modifies agent outputs based on stored risk parameters, demonstrably producing different outputs for different profiles on identical market inputs.*

### Feature 5 — Live Interface (Signals, Synthesis, Portfolio State)
- **Purpose:** Give the user one live view of everything Kaleidos knows and concluded.
- **User input:** Passive — the interface updates as agents complete.
- **System behavior:** The interface renders three panels in real time: (1) current market signals with classification labels and confidence, (2) synthesized, source-attributed recommendation, (3) current portfolio/watchlist state including position sizes and concentration.
- **Expected output:** A single-screen live session view (visual styling out of scope for this document).
- **Requirement satisfied:** *Live interface rendering signals, synthesized output with attribution, and portfolio/watchlist state.*

### Feature 6 — Performance & Session Metrics Log
- **Purpose:** Persist measurable outcomes for every session for later review.
- **User input:** None — automatic background logging.
- **System behavior:** Every session logs agent latency, confidence calibration, and portfolio concentration score (see Performance Metrics section) to a persistence layer keyed by session and user.
- **Expected output:** A queryable log of session-level metrics.
- **Requirement satisfied:** *Performance log capturing ≥3 measurable metrics per session.*

### Feature 7 — Degraded-Data Handling
- **Purpose:** Fail gracefully and transparently rather than silently or with fabricated claims.
- **User input:** None — triggered automatically when a data source is unavailable or agents conflict.
- **System behavior:** If the RAG corpus returns no relevant chunks, or two agents produce conflicting verdicts, the Synthesis Layer explicitly flags the gap instead of guessing, and marks the affected part of the recommendation as "unconfirmed" or "conflicting."
- **Expected output:** A visibly flagged, non-fabricated partial recommendation with an explanation of what's missing or conflicting.
- **Requirement satisfied:** *Graceful handling of at least one degraded-data scenario without pipeline failure or uncited output.*

---

# The Wow Factor

**Counterfactual Investment Intelligence: "Same Market, Different You"**

### What makes this feature unique
Most personalization demos show three static output cards side-by-side ("here's Conservative, here's Aggressive"). Kaleidos instead makes personalization *interrogable*: the user asks a live, natural-language counterfactual question — "What would you recommend if I were more aggressive?" — and Kaleidos replays its own reasoning pipeline under the new profile, then diffs the two runs against each other in real time.

### How it works
1. The system caches the raw, profile-agnostic outputs from the three parallel agents (Signal, RAG/Fundamental, Sentiment) for the current market snapshot — this is the "unchanged substrate."
2. On a counterfactual query, only the Profiling Layer re-executes with the new risk profile; the underlying agent evidence is never re-fetched or re-generated.
3. Kaleidos computes a structured diff between the two synthesis runs: which agent conclusions were reweighted, which risk constraints activated or deactivated, and how the final recommendation label changed (e.g. Hold → Reduce).
4. The diff is rendered as a single explanatory trace: *unchanged market signals → changed agent weighting → changed constraint → changed recommendation → stated reason.*

### Why it is technically interesting
It requires the architecture to cleanly separate **evidence generation** (profile-independent) from **evidence interpretation** (profile-dependent) — a real design discipline, not a cosmetic feature. This separation is also what makes the RAG and signal agents reusable and auditable, directly reinforcing the explainability requirement rather than sitting beside it.

### Why judges will remember it
It's the difference between "we personalized the output" (claimed) and "watch the system re-reason live, in front of you, and tell you exactly why the answer changed" (proven). It turns personalization from a static feature into a live, causal demonstration.

### How it strengthens the product instead of being a gimmick
It directly operationalizes the hardest minimum requirement — proving personalization changes outputs on identical inputs — by making the *mechanism* of that change visible and explainable, not just the *result*. It also stress-tests and showcases the explainability system, since a counterfactual diff is only trustworthy if every step is cited and traceable.

### How it can be demonstrated live in under 60 seconds
Judge picks a stock → Kaleidos shows the Moderate recommendation with full reasoning (≈20s) → judge asks "what if I were Aggressive?" → Kaleidos streams the diff trace showing the same signals, one reweighted agent conclusion, one deactivated risk constraint, and the changed recommendation with a one-line "why" (≈20s) → judge asks "and Conservative?" and sees the opposite shift instantly (≈15s).

---

# Multi-Agent Workflow

Data ingestion feeds a shared market snapshot to three specialized agents that execute in parallel: the **Signal Agent** (technical classification), the **Fundamental/Regulatory RAG Agent** (grounded document retrieval), and the **Sentiment Agent** (behavioral/news signal). Each returns a structured contract with verdict, confidence, evidence, and uncertainty. A **Synthesis Agent** consumes all three contracts, resolves agreement or flags conflict, and produces one profile-agnostic recommendation. A **Profiling Layer** then applies the active user's risk parameters to that synthesis, producing the final personalized output. Detailed agent architecture (prompts, contracts, orchestration framework) is documented separately.

---

# Personalization Logic

Given identical agent outputs, the Profiling Layer applies three mechanisms to produce different results per risk profile:

- **Reweighting:** Momentum and volatility signals are upweighted for Aggressive profiles and downweighted for Conservative profiles when computing the overall recommendation score.
- **Constraint activation:** Risk constraints (max position size, max sector concentration, volatility ceiling) are profile-specific; a signal that clears an Aggressive investor's constraints may trip a Conservative investor's constraint and downgrade the recommendation (e.g. Buy → Hold).
- **Behavioral adjustment:** Stored interaction history (e.g. a user who has historically overridden Sell recommendations) nudges confidence framing without changing the underlying evidence.

Because the three source agents never re-run, the diff between profiles is always attributable to a specific, nameable mechanism — never to non-determinism or re-generated evidence.

---

# Explainability and Trust

- **Agent reasoning:** Each agent's structured output includes a short natural-language rationale tied to the specific data points it used.
- **Confidence:** Every classification and recommendation carries a numeric or labeled confidence score, propagated through synthesis and personalization.
- **Evidence:** Signal Agent cites the underlying data points (price/volume deltas); RAG Agent cites retrieved document chunks.
- **Source attribution:** RAG-grounded claims display the originating document and chunk on demand.
- **Conflicting signals:** When agents disagree (e.g. positive technicals, negative sentiment), the Synthesis Layer surfaces the conflict explicitly rather than silently averaging it away.
- **Uncertainty:** Any recommendation built on incomplete or unavailable data is explicitly labeled "unconfirmed" or "low confidence" rather than presented at face value.

---

# Data Strategy

**Required for MVP:**
- Near-real-time (or realistically delayed) price/volume/technical indicator feed for a small fixed set of demo-ready tickers.
- A small curated document corpus (SEBI-style filings, earnings transcript excerpts) — synthetic/templated documents are acceptable and expected given the 5-hour build window, as long as retrieval and citation behave identically to a real corpus.
- A vector store (or lightweight in-memory embedding index) for the RAG layer.
- Simulated or lightly scraped sentiment data (synthetic headlines/news snippets are acceptable) since real-time sentiment infrastructure is out of scope for 5 hours.
- Sample user profiles with pre-set risk parameters and a minimal portfolio/watchlist.

**Where simulation is explicitly acceptable per the problem statement:** market data feed, document corpus, and behavioral history may all be "equivalent synthetic" data — the problem statement itself names synthetic documents as an acceptable substitute for real regulatory filings, and this same allowance is extended to price feed and sentiment data for the MVP.

---

# End-to-End Demo Scenario

1. Judge selects a pre-loaded ticker with a genuinely mixed signal profile (e.g. strong momentum, but a cautionary detail in a synthetic filing).
2. Live session view populates: Signal Agent classifies momentum as Bullish (confidence 0.82, cited on 5-day price/volume delta); RAG Agent retrieves a synthetic filing chunk flagging a pending regulatory review (cited, confidence 0.71); Sentiment Agent reads mixed social/news sentiment (confidence 0.58).
3. Synthesis Layer combines the three into a single "Hold — elevated conviction on momentum, tempered by regulatory uncertainty" recommendation, explicitly flagging the technical/regulatory conflict.
4. Profiling Layer applies the current (Moderate) profile, producing the final personalized recommendation with position-size guidance.
5. Judge triggers the counterfactual: "What if I were Aggressive?" → Kaleidos replays only the Profiling Layer, shows the unchanged agent evidence, the reweighted momentum signal, the deactivated conservative constraint, and a new recommendation ("Add — small size") with a one-line causal explanation.
6. Judge triggers "What if I were Conservative?" → opposite shift shown instantly, reinforcing the mechanism.
7. Portfolio panel updates to reflect the hypothetical position change; performance log records the session's latency and confidence metrics live.

This demo intentionally places the counterfactual wow moment at step 5–6, immediately after the judge has already seen and trusted the base recommendation — maximizing its impact.

---

# Degraded Data Scenario

**Scenario:** The document corpus returns no relevant chunks for the selected ticker (simulating an unavailable filing/data feed).

**Handling:** The RAG Agent returns a structured output with `verdict: null`, `confidence: 0`, and an explicit `status: "no_relevant_source_found"` flag instead of generating an unsupported claim. The Synthesis Layer detects the missing contract field, excludes the fundamental/regulatory dimension from the weighted recommendation, and surfaces a visible banner: *"Regulatory/filing data unavailable for this ticker — recommendation based on technical and sentiment signals only, confidence reduced accordingly."* The overall recommendation's confidence score is automatically lowered to reflect the missing dimension. No agent is permitted to fabricate a citation to fill the gap.

---

# Performance Metrics

1. **Agent response latency** — time (ms) from session start to each agent's structured output being available, and total time to synthesized recommendation.
2. **Signal-to-outcome accuracy proxy** — for demo/backtest tickers, the classified signal's directional agreement with the actual subsequent price movement over a fixed lookback window (proxy for 30-day forward return accuracy).
3. **Portfolio risk concentration score** — a computed measure (e.g. Herfindahl-style concentration index) of the user's current watchlist/portfolio exposure by sector or position size, recalculated per session.

All three are persisted per session in the performance log alongside a timestamp and the active user profile.

---

# Scope Boundaries

**WILL build in 5 hours:**
- Three parallel specialized agents (Signal, RAG/Fundamental, Sentiment) with structured output contracts.
- A synthesis layer that combines and reconciles agent outputs.
- A profiling layer supporting at least 3 risk profiles with reweighting + constraint logic.
- The counterfactual "replay under new profile" wow-factor flow, using cached agent evidence.
- A small synthetic document corpus with a lightweight vector/semantic search layer.
- A live interface rendering signals, synthesized recommendation with attribution, and portfolio/watchlist state.
- A performance log capturing the three metrics above.
- One scripted degraded-data handling path.
- A short written summary of the agent architecture (separate document).

**WILL NOT build:**
- Real brokerage integration, order execution, or real-money trading of any kind.
- A full production-grade real-time market data pipeline (a realistic simulated/delayed feed is used instead).
- User authentication/account systems beyond a small set of pre-seeded demo profiles.
- Mobile app or cross-platform packaging.
- Any UI visual design or styling decisions (explicitly out of scope per instructions — handled separately).
- Model fine-tuning or training of custom ML models — MVP uses existing LLMs/agents with prompt-level specialization plus classical signal math for the technical dimension.
- Long-horizon backtesting infrastructure beyond the proxy metric above.

---

# Hackathon Success Criteria

| # | Official Minimum Requirement | Satisfied By |
|---|---|---|
| 1 | Signal classification across ≥3 independent dimensions, confidence + cited reasoning | Feature 1 — Signal Classification Module |
| 2 | RAG component grounding ≥1 agent output in retrieved source material, visible attribution | Feature 2 — Retrieval-Augmented Regulatory/Fundamental Agent |
| 3 | ≥3 specialized parallel agents with defined roles + structured output contract + synthesis layer | Feature 3 — Multi-Agent Parallel Architecture |
| 4 | User profiling that demonstrably changes outputs on identical market inputs | Feature 4 — User Profiling & Personalization Layer, amplified by the Wow Factor's live counterfactual replay |
| 5 | Live interface rendering signals, synthesized output w/ attribution, and portfolio/watchlist state | Feature 5 — Live Interface |
| 6 | Performance log with ≥3 measurable session metrics | Feature 6 — Performance & Session Metrics Log |
| 7 | ≥1 working end-to-end demo scenario, raw data → multi-agent reasoning → recommendation, full reasoning chain visible | End-to-End Demo Scenario section |
| 8 | Graceful handling of ≥1 degraded-data scenario, no pipeline failure or uncited output | Feature 7 — Degraded-Data Handling / Degraded Data Scenario section |
| 9 | Written summary of agent architecture and decision logic for judges | Multi-Agent Workflow + Personalization Logic sections (expanded in separate architecture document) |
