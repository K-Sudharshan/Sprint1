# Kaleidos: Explainable Multi-Agent Investment Intelligence

Kaleidos is a multi-agent system that turns public market data, filings, and sentiment into a personalized, fully-cited investment recommendation in under 60 seconds.

Unlike traditional robo-advisors or black-box LLMs, Kaleidos explicitly separates *facts* from *inferences*, resolves conflicting agent perspectives (e.g., technical momentum vs. fundamental headwinds), and adjusts its final recommendation based on the user's specific risk profile.

## Quickstart

1. Install dependencies:
   ```bash
   npm install
   ```

2. Provide a Gemini API key:
   - Copy `.env.example` to `.env`
   - Add your Gemini API key: `GEMINI_API_KEY=your_api_key_here`
   *Note: If you do not provide a `GEMINI_API_KEY`, Kaleidos's degraded-data handling will automatically fall back to rule-based logic and keyword matching, ensuring the pipeline never crashes.*

3. Run the development server and frontend concurrently:
   ```bash
   npm run dev
   ```

4. The frontend will be available at `http://localhost:5173`.

## Architecture Overview

Kaleidos consists of:

- **Market Signal Agent**: Evaluates price momentum, volume anomalies, and technical trends.
- **Sentiment Agent**: Analyzes news headlines and social chatter for market psychology.
- **Fundamental RAG Agent**: Retrieves and synthesizes insights from SEC filings and earnings transcripts using semantic search.
- **Synthesis Engine (Judge)**: Weighs the evidence, resolves conflicts, applies the user's risk profile constraints, and determines the final recommendation.

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

Kaleidos consists of:
1. **Market Signal Agent:** Evaluates price momentum, volume anomaly, and technical trends deterministically.
2. **Sentiment Intelligence Agent:** Classifies market news polarity and flags internal narrative conflict.
3. **Fundamental & RAG Agent:** Uses vector similarity to retrieve relevant filings and strictly separates factual citations from inferred conclusions.
4. **Synthesis Engine & Personalization Layer:** Reconciles the three contracts, caps confidence on conflict, applies user risk constraints (e.g., volatility discounts), and generates a final explainable recommendation.

For full architectural details and decision logic, please see [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md).
