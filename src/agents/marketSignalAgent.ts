import { MarketSnapshot, MarketSignalOutput } from '../types/models';

export async function runMarketSignalAgent(snapshot: MarketSnapshot): Promise<MarketSignalOutput> {
  const timestamp = new Date().toISOString();
  
  // 1. Price Momentum (Short MA vs Long MA)
  const maDelta = snapshot.indicators.movingAverageShort - snapshot.indicators.movingAverageLong;
  let momentumLabel = 'Neutral';
  let momentumScore = 0.5;
  if (maDelta > 5) { momentumLabel = 'Strong'; momentumScore = 0.9; }
  else if (maDelta > 0) { momentumLabel = 'Positive'; momentumScore = 0.7; }
  else if (maDelta < -5) { momentumLabel = 'Weak'; momentumScore = 0.1; }
  else { momentumLabel = 'Negative'; momentumScore = 0.3; }

  // 2. Volume Anomaly
  const volumeDelta = snapshot.volume - snapshot.indicators.volumeBaseline;
  const approxStdDev = snapshot.indicators.volumeBaseline * 0.2;
  const zScore = volumeDelta / approxStdDev;
  
  let volumeLabel = 'Normal';
  let volumeScore = 0.5;
  if (zScore > 2) { volumeLabel = 'High Anomaly'; volumeScore = 0.9; }
  else if (zScore > 1) { volumeLabel = 'Elevated'; volumeScore = 0.7; }
  else if (zScore < -1) { volumeLabel = 'Low'; volumeScore = 0.3; }

  // 3. Trend Technical (RSI)
  let trendLabel = 'Neutral';
  let trendScore = 0.5;
  if (snapshot.indicators.rsi > 70) { trendLabel = 'Overbought'; trendScore = 0.2; }
  else if (snapshot.indicators.rsi < 30) { trendLabel = 'Oversold'; trendScore = 0.8; }
  else if (snapshot.indicators.rsi > 50) { trendLabel = 'Upward'; trendScore = 0.6; }
  else { trendLabel = 'Downward'; trendScore = 0.4; }

  // Combine into overall signal
  const avgScore = (momentumScore + volumeScore + trendScore) / 3;
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (avgScore > 0.6) signal = 'bullish';
  else if (avgScore < 0.4) signal = 'bearish';

  // Calculate confidence based on alignment
  const variance = (Math.pow(momentumScore - avgScore, 2) + Math.pow(volumeScore - avgScore, 2) + Math.pow(trendScore - avgScore, 2)) / 3;
  let confidence = Math.max(0.3, 1 - Math.sqrt(variance) * 2); 
  confidence = parseFloat(confidence.toFixed(2));

  return {
    agent_name: 'market_signal_agent',
    analysis_summary: `Market shows ${signal} characteristics. Momentum is ${momentumLabel}, Volume is ${volumeLabel}, and Trend (RSI) is ${trendLabel}.`,
    signal,
    confidence,
    dimensions: {
      price_momentum: { label: momentumLabel, score: momentumScore },
      volume_anomaly: { label: volumeLabel, score: volumeScore },
      trend_technical: { label: trendLabel, score: trendScore }
    },
    key_evidence: [
      `Short MA (${snapshot.indicators.movingAverageShort}) vs Long MA (${snapshot.indicators.movingAverageLong})`,
      `Volume (${snapshot.volume}) vs Baseline (${snapshot.indicators.volumeBaseline})`,
      `RSI is ${snapshot.indicators.rsi}`
    ],
    risk_factors: [
      trendLabel === 'Overbought' ? 'Risk of pullback due to overbought conditions' : '',
      volumeLabel === 'Low' ? 'Low conviction in price action due to low volume' : ''
    ].filter(Boolean),
    data_sources: ['Price Feed API', 'Technical Indicator Engine'],
    citations: ['market_data_snapshot'],
    uncertainty: 'Technical indicators are lagging metrics.',
    timestamp
  };
}
