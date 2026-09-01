import { useState, useEffect } from 'react';

export type TimeRange = '1D' | '1W' | '1M' | '6M' | '1Y';

export interface MarketDataPoint {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  ma?: number;
}

export interface MarketDataResult {
  ticker: string;
  range: TimeRange;
  currentPrice: number;
  percentageChange: number;
  history: MarketDataPoint[];
}

export function useMarketData(ticker: string, isActive: boolean) {
  const [data, setData] = useState<MarketDataResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<TimeRange>('1M');

  useEffect(() => {
    if (!ticker || !isActive) return;

    let isMounted = true;
    
    const generateSampleData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 800));

        if (!isMounted) return;

        const basePrice = 100 + (ticker.length * 15) + (ticker.charCodeAt(0) * 2);
        const dataPoints = range === '1D' ? 24 : range === '1W' ? 30 : range === '1M' ? 30 : range === '6M' ? 60 : 100;
        
        const history: MarketDataPoint[] = [];
        let currentPrice = basePrice;
        
        const now = new Date();
        const timeStep = range === '1D' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        
        const startTime = now.getTime() - (dataPoints * timeStep);
        
        for (let i = 0; i < dataPoints; i++) {
          const date = new Date(startTime + (i * timeStep)).toISOString();
          
          const volatility = basePrice * 0.03; 
          const change = (Math.random() - 0.45) * volatility; 
          
          const open = currentPrice;
          const close = Math.max(1, currentPrice + change);
          
          const maxOC = Math.max(open, close);
          const minOC = Math.min(open, close);
          
          const high = maxOC + (Math.random() * volatility * 0.5);
          const low = Math.max(0.1, minOC - (Math.random() * volatility * 0.5));
          
          currentPrice = close;
          
          history.push({
            date,
            price: parseFloat(close.toFixed(2)),
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2))
          });
        }
        
        // Calculate simple moving average (period = 5)
        const maPeriod = 5;
        for (let i = 0; i < history.length; i++) {
          if (i >= maPeriod - 1) {
            let sum = 0;
            for (let j = 0; j < maPeriod; j++) {
              sum += history[i - j].close;
            }
            history[i].ma = parseFloat((sum / maPeriod).toFixed(2));
          }
        }

        const firstPrice = history[0].close;
        const lastPrice = history[history.length - 1].close;
        const percentageChange = parseFloat((((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2));

        setData({
          ticker,
          range,
          currentPrice: lastPrice,
          percentageChange,
          history
        });

      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    generateSampleData();

    return () => {
      isMounted = false;
    };
  }, [ticker, range, isActive]);

  return { data, loading, error, range, setRange };
}
