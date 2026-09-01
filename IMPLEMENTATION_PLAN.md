# 1. Implementation Philosophy

Build one thin, real, end-to-end pipeline before building any depth. The first working version — user picks a ticker and gets a personalized, cited recommendation — must exist by the **80-minute mark**, even if every agent inside it is crude. Every phase after that replaces a crude component with a credible one, in the order the official minimum requirements are weighted, never by building components in isolation and hoping they integrate later. If a choice must be made between "more accurate" and "more demonstrable and compliant," choose demonstrable and compliant — judges score against the problem statement's minimum requirements, not against sophistication they can't see.

---

# 2. Five-Hour Timeline

| Time Block | Duration | Phase | Cumulative |
|---|---|---|---|
| 00:00 – 00:10 | 10 min | Phase 0 — Problem & Architecture Validation | 10 min |
| 00:10 – 00:35 | 25 min | Phase 1 — Project Foundation | 35 min |
| 00:35 – 01:20 | 45 min | **Phase 2 — Minimum End-to-End Pipeline** | 80 min |
| **01:20** | — | **✅ MANDATORY MVP CHECKPOINT** (well before halfway) | — |
| 01:20 – 02:05 | 45 min | Phase 3 — Multi-Agent Intelligence | 125 min |
| 02:05 – 02:40 | 35 min | Phase 4 — RAG and Evidence Grounding | 160 min |
| **02:30** | — | Halfway mark (falls inside Phase 4 — on schedule) | — |
| 02:40 – 03:15 | 35 min | Phase 5 — Personalization & Counterfactual Intelligence | 195 min |
| 03:15 – 03:40 | 25 min | Phase 6 — Conflict Resolution & Degraded Data Handling | 220 min |
| 03:40 – 04:00 | 20 min | Phase 7 — Metrics and Traceability | 240 min |
| **04:00** | — | **🧊 FEATURE FREEZE — no new features past this point** | — |
| 04:00 – 04:25 | 25 min | Phase 8 — Integration Testing (testing buffer) | 265 min |
| 04:25 – 04:45 | 20 min | Phase 9 — Deployment (deployment buffer) | 285 min |
| 04:45 – 05:00 | 15 min | Submission Safety Buffer | 300 min |

No phase consumes the full budget alone; every phase below states an explicit time limit and an explicit "if this runs long" fallback so a stall in one phase never silently eats the buffers at the end.

---

# 3. Phase-by-Phase Execution Plan

### Phase 0 — Problem and Architecture Validation
- **Objective:** Confirm the build plan still satisfies all 9 official minimum requirements before writing code.
- **Exact components to implement:** None — this is a checklist pass over `PS-Sprint1.pdf`, `PRODUCT_SPEC.md`, and `AGENT_ARCHITECTURE.md`.
- **Dependencies:** None.
- **Expected deliverable:** A confirmed go/no-go on scope; any last-minute scope trim decided *now*, not at hour 4.
- **Validation checklist:**
  - [ ] All 9 minimum requirements have a named owning component in `AGENT_ARCHITECTURE.md` §17.
  - [ ] Demo ticker(s) and synthetic data sources are decided.
  - [ ] Risk profile definitions (Conservative/Moderate/Aggressive) are final.
- **Time limit:** 10 minutes.
- **If this runs too long:** Timebox strictly — if unresolved after 10 minutes, proceed with the existing spec as-is and flag open questions to resolve opportunistically during Phase 2.

---

### Phase 1 — Project Foundation
- **Objective:** Stand up the skeleton every later phase writes into.
- **Exact components to implement:**
  - Project structure: `/agents`, `/synthesis`, `/data`, `/rag`, `/logs`, `/api` (or equivalent for the chosen stack).
  - Environment variables / config for the LLM API key(s) and any vector store config.
  - Core data models: `MarketSnapshot`, `AgentOutputContract` (base shape shared by all agents per `AGENT_ARCHITECTURE.md` §6), `UserProfile`, `SessionLog`.
  - A single orchestrator entry point (e.g. `run_session(ticker, user_id)`) — even if it does nothing yet.
- **Dependencies:** Phase 0 complete.
- **Expected deliverable:** An app that boots, loads config, and exposes one callable/endpoint that returns a hardcoded stub response.
- **Validation checklist:**
  - [ ] App starts with no errors.
  - [ ] `AgentOutputContract` model matches the fields in `AGENT_ARCHITECTURE.md` §6.
  - [ ] `run_session()` is callable and returns a stub object.
- **Time limit:** 25 minutes.
- **If this runs too long:** Drop config polish (e.g. `.env` validation, typed settings) — hardcode values temporarily and move on. Foundation only needs to unblock Phase 2, not be production-clean.

---

### Phase 2 — Minimum End-to-End Pipeline (HIGHEST PRIORITY)
- **Objective:** Get one real, unbroken path from ticker input to a rendered recommendation — every stage present, none of them polished.
- **Exact components to implement:**
  - A single hardcoded/mock `MarketSnapshot` for one demo ticker (static numbers are fine).
  - Three specialist agent functions that each return a **valid contract object** (per §6) using the simplest possible logic (e.g. one if/else rule per agent) — not yet "intelligent."
  - A synthesis function that reads all three contracts and returns one hardcoded-rule recommendation.
  - A single hardcoded `UserProfile` (Moderate) — no personalization logic yet, just pass-through.
  - A minimal output — console/log output or a bare API response is acceptable; no interface polish required yet.
- **Dependencies:** Phase 1 complete.
- **Expected deliverable:** Running `run_session("DEMO_TICKER", "demo_user")` produces a full trace: input → 3 agent contracts → synthesized recommendation, printed or returned as JSON.
- **Validation checklist:**
  - [ ] All three agent functions return contracts matching §6 shapes (even with placeholder logic).
  - [ ] Synthesis consumes all three contracts (not just one).
  - [ ] One full run completes with no unhandled exceptions.
  - [ ] Output includes a `recommendation` field.
- **Time limit:** 45 minutes. **This phase is non-negotiable — do not proceed to Phase 3 until this works.**
- **If this runs too long:** Strip further — one agent can return a static contract if its logic isn't ready, as long as the *shape* is right and the pipeline completes. A dumb-but-complete pipeline beats a smart-but-broken one at this checkpoint.

**✅ CHECKPOINT (01:20 / 80 min):** A full, ugly, end-to-end run exists. If this checkpoint is missed, stop all other work and fix the pipeline before touching any Phase 3+ feature — nothing downstream matters if this seam is broken.

---

### Phase 3 — Multi-Agent Intelligence
- **Objective:** Replace the three stub agents with real, independent reasoning per `AGENT_ARCHITECTURE.md` §4.
- **Exact components to implement:**
  - **Market Signal Agent:** real momentum calculation (e.g. short vs. long moving-average delta), real volume anomaly (z-score vs. rolling baseline), a third technical dimension; combine into a labeled classification + confidence.
  - **Sentiment Intelligence Agent:** polarity scoring over a small synthetic set of headlines/snippets for the demo ticker; aggregate score + explicit conflict flag if items disagree.
  - Each agent's `key_evidence`, `citations`, and `uncertainty` fields populated with real (not placeholder) content.
- **Dependencies:** Phase 2's pipeline must be running end-to-end.
- **Expected deliverable:** Market Signal and Sentiment agents produce genuinely different, data-driven outputs for at least two different demo tickers (proves independence, not copy-paste).
- **Validation checklist:**
  - [ ] Market Signal Agent's three dimensions each derive from distinct calculations.
  - [ ] Sentiment Agent flags conflict when given intentionally mixed sample headlines.
  - [ ] Swapping the demo ticker changes agent outputs (not hardcoded).
- **Time limit:** 45 minutes.
- **If this runs too long:** Keep whichever agent is furthest along fully real; let the other fall back to a simplified rule-based version (still using real input data, just fewer dimensions) rather than blocking the schedule — the Fundamental & RAG Agent's real logic is covered separately in Phase 4 and must not be sacrificed for this.

---

### Phase 4 — RAG and Evidence Grounding
- **Objective:** Implement the Fundamental & RAG Agent for real, satisfying the RAG minimum requirement directly.
- **Exact components to implement:**
  - A small synthetic document corpus (3–8 short filing/transcript-style documents) for the demo ticker(s), chunked into short passages.
  - An embedding + similarity search step (in-memory vector store is sufficient) over those chunks.
  - Retrieval logic returning top-k chunks above a relevance threshold for a query built from the session context.
  - Generation step that produces a verdict *only* from retrieved chunks, split into `retrieved_facts` (cited) vs. `inferred_conclusions`.
  - No-match fallback: if retrieval returns nothing above threshold, return `signal: "no_relevant_source_found"`, `confidence: 0` (do not fabricate).
- **Dependencies:** Phase 1's data models; can start in parallel with Phase 3 if a second builder/agent is available (see §6).
- **Expected deliverable:** A working retrieval call that returns real chunk citations attached to a generated verdict, visible in the session output.
- **Validation checklist:**
  - [ ] Retrieval returns chunks specific to the query (not the whole corpus).
  - [ ] Every claim in `retrieved_facts` has a traceable citation (document + excerpt).
  - [ ] No-match path tested and does not fabricate a claim.
- **Time limit:** 35 minutes.
- **If this runs too long:** Drop the vector similarity search and substitute simple keyword/substring matching over the corpus for chunk selection — the *contract shape* (citations, fact/inference split, no-match handling) matters more to compliance than the retrieval algorithm's sophistication.

---

### Phase 5 — Personalization and Counterfactual Intelligence
- **Objective:** Implement the Personalization Layer and the counterfactual replay — this directly satisfies the hardest minimum requirement and the wow factor.
- **Exact components to implement:**
  - Three profile definitions (Conservative/Moderate/Aggressive) with concrete weights and constraints per `AGENT_ARCHITECTURE.md` §8 (exposure limits, volatility discount, concentration limit).
  - Reweighting logic applied inside synthesis, driven by the active profile.
  - Constraint-gating logic that can downgrade a recommendation (e.g. Buy → Hold) when a profile's constraint is breached.
  - An evidence cache keyed by session, storing the three specialist contracts so they are **not re-generated** on a counterfactual request.
  - A counterfactual function that re-runs only the personalization/synthesis step against cached evidence for a different profile and returns a diff object (unchanged evidence, changed weights/constraints, changed recommendation, one-line reason).
- **Dependencies:** Phases 2–4 producing real specialist contracts to personalize over.
- **Expected deliverable:** Calling the pipeline with the same ticker under two different profiles produces two different recommendations; calling the counterfactual function reuses cached evidence and returns a clear diff.
- **Validation checklist:**
  - [ ] Same market inputs → different `recommendation` value across at least two profiles for at least one demo ticker.
  - [ ] Counterfactual call does NOT re-invoke the three specialist agents (verify via a log/counter).
  - [ ] Diff output names the specific constraint/weight that changed the outcome.
- **Time limit:** 35 minutes. **This phase is Tier 1 — do not cut it for time; cut elsewhere first (see §14).**
- **If this runs too long:** Reduce to two profiles (Conservative, Aggressive) instead of three, and to one constraint mechanism (exposure limit) instead of three — but keep the cached-evidence counterfactual replay intact at all costs, since it is both a minimum requirement and the wow factor.

---

### Phase 6 — Conflict Resolution and Degraded Data Handling
- **Objective:** Make disagreement and missing data visible and handled, not hidden.
- **Exact components to implement:**
  - Pairwise agreement check across the three specialist `signal` fields; compute an `agent_agreement_score`.
  - `conflicts_detected` population with a plain-language description when agents disagree.
  - Confidence capping: final recommendation confidence ≤ `agent_agreement_score`.
  - One fully working degraded-data path (recommend: Phase 4's "no relevant filing found" scenario, since it's the easiest to trigger reliably on demand for a live demo).
- **Dependencies:** Phase 3 and Phase 4 producing real, sometimes-disagreeing contracts.
- **Expected deliverable:** A demo run using intentionally conflicting synthetic inputs produces a visibly flagged, lower-confidence, cautious recommendation instead of a confident average.
- **Validation checklist:**
  - [ ] Conflict test case (bullish technical + bearish sentiment) produces `conflicts_detected` populated and reduced confidence.
  - [ ] Degraded-data test case produces no fabricated claim and a visible "missing data" flag.
- **Time limit:** 25 minutes.
- **If this runs too long:** Implement conflict detection only (agreement score + flag) and skip the confidence-capping formula's tuning — a simple binary "conflict: true/false" with a fixed confidence penalty is acceptable if time is short.

---

### Phase 7 — Metrics and Traceability
- **Objective:** Persist the reasoning trace and required session metrics.
- **Exact components to implement:**
  - Session log writer capturing each pipeline stage (per `AGENT_ARCHITECTURE.md` §13) as structured entries.
  - Three metrics minimum: agent response latency (per agent + total), `agent_agreement_score`, portfolio concentration score (can be a simple Herfindahl-style calc over the demo portfolio).
  - A way to retrieve/print a session's full trace and metrics after a run.
- **Dependencies:** Phases 2–6 producing the stages to log.
- **Expected deliverable:** After any full pipeline run, a session log/JSON exists showing every stage and the three-plus metrics.
- **Validation checklist:**
  - [ ] Log includes all 8 stages from the reasoning trace diagram.
  - [ ] All 3+ metrics are present and non-null after a run.
- **Time limit:** 20 minutes.
- **If this runs too long:** Cut down to console/structured-print logging instead of a persistent store — the requirement is that metrics are *captured per session*, not that they live in a database.

**🧊 FEATURE FREEZE (04:00 / 240 min):** No new features past this point — only bug fixes, integration glue, and demo-readiness work for the remaining 60 minutes.

---

### Phase 8 — Integration Testing
- **Objective:** Prove the full system works end-to-end under the exact conditions of the planned demo.
- **Exact components to implement:** No new features — test execution only.
  - Run the full End-to-End Demo Scenario from `PRODUCT_SPEC.md`.
  - Run the counterfactual flow (Moderate → Aggressive → Conservative) on the demo ticker.
  - Run the degraded-data scenario on demand.
  - Fix any breakage found — bugs only, no scope additions.
- **Dependencies:** All prior phases.
- **Expected deliverable:** A rehearsed, working run-through of the exact demo script, timed to under 60 seconds for the wow-factor moment.
- **Validation checklist:**
  - [ ] Full demo scenario runs without error, twice in a row.
  - [ ] Counterfactual diff renders correctly for at least 2 profile switches.
  - [ ] Degraded-data scenario triggers and displays correctly, not silently.
- **Time limit:** 25 minutes.
- **If this runs too long:** Cut scope to the single most reliable demo ticker and script — abandon secondary tickers/scenarios entirely rather than risk the primary demo being under-tested.

---

### Phase 9 — Deployment and Submission
- **Objective:** Make the working system reachable and submittable.
- **Exact components to implement:**
  - Push final code to the submission GitHub repository.
  - Write a concise README (setup steps, how to run the demo, architecture summary link).
  - Deploy if the format requires a live link; otherwise confirm local run instructions are exact and tested.
  - Attach/link `PRODUCT_SPEC.md` and `AGENT_ARCHITECTURE.md` as the "written architecture summary" required by the problem statement.
- **Dependencies:** Phase 8 passing.
- **Expected deliverable:** A submittable repository/link with a working demo path and supporting docs.
- **Validation checklist:**
  - [ ] Fresh clone/install instructions actually work (test once if time allows).
  - [ ] README states exactly how to trigger the demo scenario and the counterfactual flow.
  - [ ] Required judge-facing architecture summary is included or linked.
- **Time limit:** 20 minutes.
- **If this runs too long:** Skip live deployment and submit a local-run repo with crystal-clear setup instructions plus a recorded/backup demo path — a working local demo beats a broken live deploy.

**Submission Safety Buffer (04:45–05:00 / 15 min):** No new work. Final sanity run of the demo script exactly as it will be presented, and submission form/link double-check.

---

# 4. MVP Priority Tiers

### Tier 1 — Non-Negotiable
- Three specialist agents (Market Signal, Sentiment, Fundamental & RAG) with real logic and valid structured contracts.
- Synthesis layer consuming all three contracts.
- RAG retrieval with visible source citations and a no-match fallback.
- Personalization Layer with ≥2 profiles demonstrably producing different recommendations on identical input.
- Counterfactual replay using cached evidence (no re-running specialists).
- Conflict detection with a visible flag and confidence adjustment.
- One working degraded-data scenario.
- Three measurable session metrics logged.
- A single working end-to-end demo scenario, fully rehearsed.

### Tier 2 — High-Impact
- Third risk profile (all three: Conservative/Moderate/Aggressive) rather than two.
- Full reasoning trace UI/log covering all 8 pipeline stages (vs. a partial log).
- Sentiment conflict detection (internal disagreement within sentiment sources).
- A second demo ticker for resilience/variety in Q&A.
- Retrieval relevance and confidence-distribution metrics beyond the required three.

### Tier 3 — Nice-to-Have
- Portfolio concentration score computed from a richer, multi-position demo portfolio (vs. a single hardcoded value).
- Additional technical dimensions beyond the three required.
- Historical/behavioral profile adjustment (past-override nudging) referenced in `PRODUCT_SPEC.md`.
- Live (rather than static/replayed) market data connection.
- Polished session trace export (formatted report, not just structured log).

---

# 5. Dependency Graph

```
Phase 0 (Validation)
      │
      ▼
Phase 1 (Foundation: models, config, orchestrator skeleton)
      │
      ▼
Phase 2 (Minimum End-to-End Pipeline — stub agents + stub synthesis)
      │
      │   ◄── MANDATORY CHECKPOINT: must be a real, complete run ──►
      │
      ├─────────────────────────────┬─────────────────────────────┐
      ▼                             ▼                             ▼
Phase 3                       Phase 4                       (prep only)
Market Signal +               Fundamental & RAG Agent        Personalization
Sentiment Agents               (corpus + retrieval)           profile constants
(can run in parallel           (can run in parallel            can be authored
 with Phase 4)                  with Phase 3)                   any time after P1
      │                             │                             │
      └─────────────┬───────────────┴──────────────┬──────────────┘
                     ▼                              ▼
              Phase 5 (Personalization + Counterfactual)
              — depends on real contracts from Phase 3 & 4
                     │
                     ▼
              Phase 6 (Conflict Resolution + Degraded Data)
              — depends on Phase 3 & 4 outputs to have something to conflict/degrade
                     │
                     ▼
              Phase 7 (Metrics + Traceability)
              — depends on all pipeline stages existing
                     │
                     ▼
              Phase 8 (Integration Testing)
                     │
                     ▼
              Phase 9 (Deployment + Submission)

SAFE TO SKIP UNDER TIME PRESSURE (in this order):
  1. Tier 3 items entirely
  2. Third risk profile (keep 2)
  3. Sentiment internal-conflict detection
  4. Vector similarity search (fallback to keyword match)
  5. Live deployment (fallback to local-run repo)
```

---

# 6. Parallel Development Opportunities

If more than one builder (human or AI coding agent) is available, split immediately after Phase 2's checkpoint:

| Track | Ownership | Files/Components | Inputs Required | Output Contract | Integration Point |
|---|---|---|---|---|---|
| **Track A — Market & Sentiment Agents** | Builder A | `/agents/market_signal.py`, `/agents/sentiment.py` | `MarketSnapshot` model (Phase 1), synthetic headline set | Two `AgentOutputContract` objects per §6.1/§6.2 | Read by Synthesis layer; no dependency on Track B |
| **Track B — RAG / Fundamental Agent** | Builder B | `/rag/corpus.py`, `/rag/retriever.py`, `/agents/fundamental_rag.py` | Synthetic document corpus, `AgentOutputContract` base model | One `AgentOutputContract` per §6.3 with `retrieved_facts`/`inferred_conclusions` | Read by Synthesis layer; no dependency on Track A |
| **Track C — Synthesis, Personalization, Counterfactual** | Builder C | `/synthesis/engine.py`, `/synthesis/profiles.py`, `/synthesis/counterfactual.py` | The contract *shape* from Tracks A & B (agreed upfront in Phase 1 — can build against stub contracts before A/B finish) | Final recommendation contract per §6.4 | Consumes A & B outputs at Phase 5 merge point |
| **Track D — Metrics, Logging, Deployment** | Builder D | `/logs/session_log.py`, `/api` wiring, README, deploy config | Pipeline stage boundaries (agreed in Phase 1) | Structured session log + metrics | Wraps the whole pipeline; integrates last, in Phase 7–9 |

**Conflict avoidance:** All four tracks agree on the `AgentOutputContract` and profile/constraint schemas in Phase 1, before splitting — this is what lets Track C build and test the synthesis engine against *stub* contracts while Tracks A and B are still finishing real logic, with a merge at Phase 5 rather than a big-bang integration at the end.

---

# 7. Technical Simplification Strategy

| Component | Ideal Implementation | Hackathon Implementation |
|---|---|---|
| **Market data ingestion** | Live exchange API with streaming updates | A small static/replayed dataset for 2–3 demo tickers, loaded at session start |
| **Technical signal classification** | ML-based pattern recognition across many indicators | Deterministic math on 3 dimensions: moving-average delta (momentum), volume z-score (anomaly), simple trend slope (technical) |
| **Sentiment analysis** | Live news/social scraping + trained NLP sentiment model | A curated synthetic set of 6–10 headlines/snippets per ticker, scored via LLM prompt or a simple lexicon |
| **RAG retrieval** | Hosted vector DB, re-ranking, large real filing corpus | In-memory embedding store (or keyword fallback) over a small synthetic corpus of 3–8 documents |
| **Multi-agent orchestration** | Message-queue-based distributed agent framework with retries | Direct async/parallel function calls from one orchestrator, in-process |
| **User profiles** | Full account system with persisted long-term behavioral learning | 2–3 pre-seeded demo profiles (Conservative/Moderate/Aggressive) as static config |
| **Counterfactual intelligence** | Fully general "replay any historical session under any profile" engine | Cached in-session evidence + re-run of the personalization step only, for the current session |
| **Conflict resolution** | Probabilistic ensemble weighting with learned agent reliability | Rule-based pairwise agreement score + fixed confidence-capping formula |
| **Metrics** | Full observability stack with dashboards and historical trend analysis | Structured per-session log entries with the 3+ required metrics, printed or written to a flat file/simple DB table |
| **Logging** | Centralized, queryable, distributed tracing | Linear structured log per session, one entry per pipeline stage |

None of these simplifications skip a stated minimum requirement — each hackathon version still produces the same **contract shape** (confidence, citations, attribution, structured output) that the official requirements and `AGENT_ARCHITECTURE.md` demand; only the underlying sophistication is reduced.

---

# 8. AI Coding Agent Workflow

An AI coding agent (or human developer) working from this plan should follow this loop for every task:

1. **Read the relevant specification section** (`PRODUCT_SPEC.md` feature, or the matching numbered section of `AGENT_ARCHITECTURE.md`) before writing or modifying any code for that task.
2. **Inspect the existing project structure** — check what already exists in `/agents`, `/synthesis`, `/rag`, `/logs` before creating new files or duplicating logic.
3. **Implement one logical feature at a time** — one phase's checklist item per work unit, not multiple simultaneously.
4. **Avoid modifying unrelated files** — a change to the Sentiment Agent should not touch the Fundamental & RAG Agent's file.
5. **Run the application after each major change** — every feature implementation ends with an actual execution, not just a read-through of the code.
6. **Fix errors before moving to the next feature** — no phase is "done" while the app throws on a normal run.
7. **Maintain structured outputs between components** — never let one agent's output silently drift from the `AgentOutputContract` shape agreed in Phase 1; if a field must change, update the shared model, not just one agent.
8. **Never replace working functionality unnecessarily** — if the Phase 2 stub agent logic already passes its checklist, extend it in Phase 3 rather than rewriting it from scratch.
9. **Keep checkpoints at major milestones** — commit (or otherwise snapshot) at the end of every phase in this plan, so a broken later phase can be rolled back without losing prior working phases.
10. **Verify the build before declaring a phase complete** — run that phase's validation checklist literally, item by item, before moving to the next phase.

---

# 9. Checkpoints and Feature Freeze Strategy

- **01:20 (80 min) — Mandatory MVP Checkpoint:** A complete, ugly, end-to-end run must exist. If not, all further feature work stops until it does — this checkpoint is non-negotiable because everything else in the plan assumes this seam works.
- **02:30 (150 min) — Halfway Check-in:** Confirm Phases 3–4 are on track (falls inside Phase 4 per the timeline). If Phase 4 is not yet complete by 02:40, invoke the Phase 4 fallback (keyword-match retrieval) immediately rather than letting it slip further.
- **04:00 (240 min) — Feature Freeze:** No new features, no new agents, no new profile logic past this point. Only bug fixes, integration glue, and demo rehearsal for the remaining hour.
- **04:25 (265 min) — Deployment Go/No-Go:** If integration testing (Phase 8) is not passing cleanly by this point, skip live deployment and commit to a local-run + backup-recording demo strategy immediately (see §10).
- **04:45 (285 min) — Submission Safety Buffer begins:** No code changes at all — only a final rehearsal run and submission logistics.

---

# 10. Failure and Fallback Protocol

| Scenario | Fallback Decision |
|---|---|
| **External market data API doesn't work** | Switch immediately to the static/replayed dataset (already planned as the Hackathon Implementation in §7) — do not spend more than 10 minutes debugging a live feed. |
| **AI model API fails or rate-limits** | Fall back to a secondary provider/model if configured; otherwise reduce agent LLM calls to the minimum needed for the demo ticker only, and cache successful responses aggressively to avoid repeat calls during rehearsal. |
| **RAG implementation becomes too complex** | Drop vector similarity search; use keyword/substring matching over the synthetic corpus instead — the retrieval *mechanism* is not what's being judged, the citation/attribution *behavior* is. |
| **Deployment fails** | Abandon live deployment; submit a local-run repository with exact, tested setup instructions, and prepare a screen recording of the working local demo as a backup artifact. |
| **One specialist agent is not functioning** | Synthesis proceeds with the remaining agents per the degraded-data handling design (§6/§12 of `AGENT_ARCHITECTURE.md`) — this is not a crisis, it's a designed-for scenario; demonstrate it as intended graceful degradation rather than hiding it. |
| **A feature takes longer than its phase's time limit** | Apply that phase's specific "if this runs too long" fallback (see §3) immediately at the time limit — do not silently extend a phase into the next one's time block. |
| **The project is behind schedule generally** | Re-check §14 Emergency Scope Reduction Plan and cut in the stated order — do not improvise cuts; the pre-decided order protects compliance with the minimum requirements. |

**Standing priority, restated:** a working end-to-end demo that meets the minimum requirements always outranks any additional feature, regardless of how far along that feature is.

---

# 11. Testing Strategy

- **Unit-level (during each phase):** After implementing each agent or synthesis step, run it directly against 1–2 known inputs and manually confirm the output contract shape and field values are sane — this happens inside each phase's time box, not as a separate pass.
- **Integration-level (Phase 8):** Run the full pipeline end-to-end at least twice using the exact demo ticker and exact demo script from `PRODUCT_SPEC.md`'s End-to-End Demo Scenario.
- **Scenario-specific tests (Phase 8):**
  - Conflict test: feed intentionally disagreeing technical/sentiment signals and confirm `conflicts_detected` and confidence capping fire.
  - Degraded-data test: force the RAG agent's no-match path and confirm no fabricated claim appears.
  - Counterfactual test: run the same session under Moderate then Aggressive (then Conservative, if built) and confirm the diff correctly names the changed constraint/weight.
- **Regression check:** After any Phase 8 bug fix, re-run the full demo scenario once more before moving to Phase 9 — a fix late in testing can silently break something upstream.

---

# 12. Deployment and Submission Plan

1. Ensure the repository is clean: no stray debug code, no committed secrets/API keys (use environment variables).
2. Write the README to include: setup steps, how to run the demo scenario, how to trigger the counterfactual flow, and a link to (or embedded summary of) `PRODUCT_SPEC.md` and `AGENT_ARCHITECTURE.md` as the required written architecture summary.
3. If a live deployment is required by the submission format, deploy to the simplest available hosting option and verify the live link actually runs the demo scenario once before the buffer period ends.
4. If deployment is not required or is failing, finalize local-run instructions and, time permitting, record a short backup video of the working local demo.
5. Confirm the submission form/repository link is correct and accessible before the final buffer expires.

---

# 13. Final Demo Readiness Checklist

- [ ] At least three independent specialized agents are implemented and callable.
- [ ] Agents are dispatched in parallel (or independently) rather than sequentially chained.
- [ ] Every agent returns a structured output matching its defined contract.
- [ ] Signal classification spans at least three independent dimensions with stated confidence.
- [ ] RAG-based evidence is retrieved and cited with visible source attribution.
- [ ] Fact vs. inference is explicitly distinguished in the Fundamental & RAG Agent's output.
- [ ] Personalized outputs differ across at least two risk profiles on identical market input.
- [ ] The counterfactual "what if I had a different risk profile?" flow works and reuses cached evidence.
- [ ] Conflict detection fires correctly on a deliberately conflicting test case.
- [ ] At least one degraded-data scenario is handled gracefully with no uncited claim.
- [ ] At least three session performance metrics are logged per run.
- [ ] A full reasoning trace is available and traceable from recommendation back to raw evidence.
- [ ] The complete end-to-end flow (input → data → parallel agents → RAG → personalization → synthesis → recommendation) runs without manual intervention.
- [ ] The demo script has been rehearsed at least twice, timed, including the wow-factor moment.
- [ ] README and submission artifacts are complete and accurate.

---

# 14. Emergency Scope Reduction Plan

If time is running out, cut **in this exact order** — each step preserves compliance with the official minimum requirements as long as possible before touching anything load-bearing:

1. **Cut Tier 3 items entirely** (richer portfolio scoring, extra technical dimensions, behavioral history nudging, live data connection, polished trace export) — none of these are required by the problem statement.
2. **Reduce risk profiles from three to two** (Conservative, Aggressive) — the requirement is "different outputs for different profiles," which two profiles still satisfies; add Moderate back only if time reappears.
3. **Simplify Sentiment Agent's internal conflict detection** to a single aggregate score without the sub-conflict flag — the agent still produces a valid, independent contract.
4. **Replace vector similarity search with keyword/substring matching** for RAG retrieval — the citation/attribution behavior (the actual requirement) is unaffected.
5. **Reduce the demo to a single ticker** and drop any secondary/backup ticker — rehearsal time is better spent perfecting one path.
6. **Drop live deployment** in favor of a local-run repository with a backup recording — a working local demo satisfies the "working end-to-end demo" requirement; a broken live deploy does not.
7. **Reduce logging from a persistent store to structured console/flat-file output** — the requirement is metric capture per session, not storage architecture.

**Never cut, under any time pressure, because each is directly and individually named in the official minimum requirements:**
- The three specialized parallel agents themselves.
- The RAG grounding + visible citation behavior.
- The personalization mechanism producing different outputs on identical input.
- The counterfactual/cached-evidence replay (this is both a requirement-strengthening mechanism and the wow factor — cutting it costs both compliance and differentiation).
- Conflict surfacing (must never silently average).
- At least one working degraded-data path.
- At least three logged session metrics.
- The single end-to-end demo scenario with visible reasoning chain.
