import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMarketData, type TimeRange } from '@/hooks/useMarketData';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketChartProps {
  ticker: string;
}

const Candlestick = (props: any) => {
  const { x, y, width, height, payload, yAxisMin } = props;
  
  // Safely return if recharts passes NaN (which crashes the SVG)
  if (typeof y !== 'number' || typeof height !== 'number' || isNaN(y) || isNaN(height)) {
    return null;
  }

  const isGrowing = payload.close >= payload.open;
  const color = isGrowing ? '#10b981' : '#f43f5e'; // emerald-500 : rose-500
  
  // The Bar for "close" goes from yAxisMin up to payload.close.
  // height = (payload.close - yAxisMin) * pixelsPerDollar
  const valDiff = payload.close - yAxisMin;
  const pixelsPerDollar = valDiff !== 0 ? height / valDiff : 0;
  
  const bottomPixel = y + height;
  
  const getPixel = (price: number) => {
    if (pixelsPerDollar === 0 || !isFinite(pixelsPerDollar)) return y;
    return bottomPixel - (price - yAxisMin) * pixelsPerDollar;
  };
  
  const highPixel = getPixel(payload.high);
  const lowPixel = getPixel(payload.low);
  const openPixel = getPixel(payload.open);
  const closePixel = getPixel(payload.close);
  
  const bodyTop = Math.min(openPixel, closePixel);
  const bodyBottom = Math.max(openPixel, closePixel);
  const bodyHeight = Math.max(1, bodyBottom - bodyTop);

  return (
    <g>
      {/* Wick */}
      <line x1={x + width / 2} y1={highPixel} x2={x + width / 2} y2={lowPixel} stroke={color} />
      {/* Body */}
      <rect x={x} y={bodyTop} width={width} height={bodyHeight} fill={isGrowing ? 'transparent' : color} stroke={color} strokeWidth={1} />
    </g>
  );
};

export function MarketChart({ ticker }: MarketChartProps) {
  const { data, loading, error, range, setRange } = useMarketData(ticker, true);

  if (loading) {
    return (
      <div className="w-full h-80 bg-[#050505] border border-neutral-900 rounded-xl flex items-center justify-center">
        <div className="flex flex-col items-center text-neutral-500">
          <div className="size-5 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin mb-3" />
          <p className="text-sm">Fetching market data for {ticker}...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-80 bg-[#050505] border border-neutral-900 rounded-xl flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center">
          <AlertTriangle className="size-6 text-neutral-600 mb-3" />
          <p className="text-sm font-medium text-neutral-400">Market data unavailable</p>
          <p className="text-xs text-neutral-600 mt-1 max-w-sm">
            {error || 'Unable to load historical price data for this asset.'}
          </p>
        </div>
      </div>
    );
  }

  const isPositive = data.percentageChange >= 0;

  const ranges: TimeRange[] = ['1D', '1W', '1M', '6M', '1Y'];

  // Map data to ensure all OHLC properties exist safely
  const chartData = data.history.map(d => {
    const low = d.low !== undefined ? d.low : d.price;
    const high = d.high !== undefined ? d.high : d.price;
    return {
      ...d,
      open: d.open !== undefined ? d.open : d.price,
      close: d.close !== undefined ? d.close : d.price,
      low,
      high
    };
  });

  // Determine global min and max to pad Y-axis slightly safely
  const lows = chartData.map(d => d.low).filter(v => typeof v === 'number' && !isNaN(v));
  const highs = chartData.map(d => d.high).filter(v => typeof v === 'number' && !isNaN(v));
  
  const globalMin = lows.length > 0 ? Math.min(...lows) : 0;
  const globalMax = highs.length > 0 ? Math.max(...highs) : 100;
  
  // Ensure we don't have a 0-height domain which can crash recharts
  const diff = globalMax - globalMin;
  const padding = diff === 0 ? globalMax * 0.1 || 10 : diff * 0.1;
  
  const yMin = Math.max(0, globalMin - padding);
  const yMax = globalMax + padding;

  return (
    <div className="w-full bg-[#050505] border border-neutral-900 rounded-xl p-6 flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-mono uppercase tracking-widest text-neutral-500 mb-1">
            {ticker} Market Trend
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-light text-neutral-100">
              ${data.currentPrice.toFixed(2)}
            </span>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded",
              isPositive ? "bg-emerald-950/30 text-emerald-400" : "bg-rose-950/30 text-rose-400"
            )}>
              {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(data.percentageChange)}%
            </div>
          </div>
        </div>

        <div className="flex items-center bg-neutral-900 p-1 rounded-md">
          {ranges.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                range === r 
                  ? "bg-[#020202] text-neutral-200 shadow-sm border border-neutral-800" 
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#171717" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(val) => {
                if (!val) return '';
                const date = new Date(val);
                if (range === '1D') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
              }}
              stroke="#262626"
              tick={{ fill: '#525252', fontSize: 10 }}
              tickMargin={10}
              minTickGap={30}
            />
            <YAxis 
              domain={[yMin, yMax]} 
              stroke="#262626"
              tick={{ fill: '#525252', fontSize: 10 }}
              tickFormatter={(val) => `$${Number(val).toFixed(0)}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0a0a0a', 
                border: '1px solid #262626',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#e5e5e5' }}
              labelStyle={{ color: '#737373', marginBottom: '4px' }}
              labelFormatter={(val) => {
                if (!val) return '';
                const date = new Date(val as string);
                return range === '1D' || range === '1W' 
                  ? date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
              }}
              formatter={(value: any, name: any, props: any) => {
                if (name === 'close') {
                  const { open, high, low, close } = props.payload;
                  return [`O: ${Number(open).toFixed(2)} H: ${Number(high).toFixed(2)} L: ${Number(low).toFixed(2)} C: ${Number(close).toFixed(2)}`, 'OHLC'];
                }
                if (name === 'ma') return [`$${Number(value).toFixed(2)}`, 'Moving Average'];
                return [`$${Number(value).toFixed(2)}`, name];
              }}
            />
            <Bar dataKey="close" shape={<Candlestick yAxisMin={yMin} />} isAnimationActive={false} />
            <Line type="monotone" dataKey="ma" stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
