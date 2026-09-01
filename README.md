# Lumen: Explainable Multi-Agent Investment Intelligence

Lumen is a multi-agent system that turns public market data, filings, and sentiment into a personalized, fully-cited investment recommendation in under 60 seconds.

This project implements the architecture outlined in [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md) and [PRODUCT_SPEC.md](./PRODUCT_SPEC.md), fulfilling all hackathon requirements including:
- 3 Specialized Parallel Agents (Market Signal, Sentiment Intelligence, Fundamental/RAG).
- RAG grounding with vector similarity and source attribution.
- Dynamic user risk profiling.
- Counterfactual engine demonstrating transparent reasoning.
- Graceful degraded-data fallback.

## 🚀 Setup & Installation

1. **Install Node.js (v18+)** if you don't already have it.
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Set Up Environment Variables:**
   Copy the example environment file and add your Google Gemini API key. The system uses the `@google/genai` SDK for LLM sentiment analysis and RAG vector embeddings.
   ```bash
   cp .env.example .env
   ```
   *Note: If you do not provide a `GEMINI_API_KEY`, Lumen's degraded-data handling will automatically fall back to rule-based logic and keyword matching, ensuring the pipeline never crashes.*

## 💻 Running the Demo (Backend Pipeline)

To run the complete end-to-end pipeline, which dispatches the 3 agents, synthesizes their findings, logs session metrics, and demonstrates the "Wow Factor" counterfactual engine, execute:

```bash
npx tsx src/index.ts
```

### What You Will See in the Demo:
1. **Parallel Execution:** The 3 agents run concurrently on a mock market snapshot for `RELIANCE`.
2. **Synthesis & Personalization:** The agents' outputs are synthesized into a single recommendation using a "moderate" investor profile.
3. **Counterfactual "Wow Factor":** The system automatically replays the exact same market evidence against two alternative profiles (`aggressive` and `conservative`) and outputs a diff explaining *exactly* why the recommendation changed.

## 🏗 Architecture Summary

Lumen consists of:
1. **Market Signal Agent:** Evaluates price momentum, volume anomaly, and technical trends deterministically.
2. **Sentiment Intelligence Agent:** Classifies market news polarity and flags internal narrative conflict.
3. **Fundamental & RAG Agent:** Uses vector similarity to retrieve relevant filings and strictly separates factual citations from inferred conclusions.
4. **Synthesis Engine & Personalization Layer:** Reconciles the three contracts, caps confidence on conflict, applies user risk constraints (e.g., volatility discounts), and generates a final explainable recommendation.

For full architectural details and decision logic, please see [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md).
