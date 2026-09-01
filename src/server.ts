import express from 'express';
import cors from 'cors';
import { runSession } from './index';
import { runCounterfactual } from './synthesis/counterfactual';
import { initializeCorpus } from './rag/corpus';
import { UserProfile } from './types/models';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), 'public')));

app.post('/api/session', async (req, res) => {
  try {
    const { ticker, riskProfile } = req.body;
    
    if (!ticker || !riskProfile) {
      return res.status(400).json({ error: 'Missing ticker or riskProfile' });
    }

    const profile: UserProfile = {
      id: 'web_user',
      riskProfile,
      portfolioConstraints: {
        maxExposurePercent: 10
      }
    };

    const log = await runSession(ticker, profile);
    res.json(log);
  } catch (error: any) {
    console.error('Session Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/counterfactual', async (req, res) => {
  try {
    const { log, targetProfile } = req.body;
    
    if (!log || !targetProfile) {
      return res.status(400).json({ error: 'Missing log or targetProfile' });
    }

    const diff = await runCounterfactual(
      log.agentOutputs.marketSignal,
      log.agentOutputs.sentiment,
      log.agentOutputs.fundamentalRag,
      log.userProfile,
      targetProfile
    );

    res.json(diff);
  } catch (error: any) {
    console.error('Counterfactual Error:', error);
    res.status(500).json({ error: error.message });
  }
});

import { getHistoricalMarketData, TimeRange } from './services/marketDataService';

app.get('/api/market-data', async (req, res) => {
  try {
    const ticker = req.query.ticker as string;
    const range = (req.query.range as string) || '1M';

    if (!ticker) {
      return res.status(400).json({ error: 'Missing ticker parameter' });
    }

    const validRanges: TimeRange[] = ['1D', '1W', '1M', '6M', '1Y'];
    const timeRange = validRanges.includes(range as TimeRange) ? (range as TimeRange) : '1M';

    const data = await getHistoricalMarketData(ticker, timeRange);
    res.json(data);
  } catch (error: any) {
    console.error('Market Data API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  console.log('Initializing Corpus Embeddings...');
  await initializeCorpus();
  console.log('Corpus Initialized.');
  
  app.listen(port, () => {
    console.log(`\n🚀 Lumen server running on http://localhost:${port}`);
  });
}

startServer().catch(console.error);
