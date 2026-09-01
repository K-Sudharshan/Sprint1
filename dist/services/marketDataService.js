import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
export async function getHistoricalMarketData(ticker, range) {
    const now = new Date();
    let period1;
    let interval;
    switch (range) {
        case '1D':
            period1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
            interval = '5m';
            break;
        case '1W':
            period1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            interval = '15m';
            break;
        case '1M':
            period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            interval = '1d';
            break;
        case '6M':
            period1 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            interval = '1d';
            break;
        case '1Y':
        default:
            period1 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            interval = '1d';
            break;
    }
    try {
        // Check if it's an Indian stock without a suffix
        let queryTicker = ticker;
        if (['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'WIPRO', 'ITC', 'SBIN', 'BHARTIARTL'].includes(ticker.toUpperCase())) {
            queryTicker = `${ticker.toUpperCase()}.NS`;
        }
        const queryOptions = {
            period1,
            interval,
        };
        const result = await yahooFinance.chart(queryTicker, queryOptions);
        if (!result || !result.quotes || result.quotes.length === 0) {
            throw new Error(`No historical data found for ${ticker}`);
        }
        const history = result.quotes
            .filter((q) => q.close !== null)
            .map((q) => ({
            date: q.date.toISOString(),
            price: parseFloat(q.close.toFixed(2))
        }));
        if (history.length === 0) {
            throw new Error(`No valid closing prices found for ${ticker}`);
        }
        const currentPrice = history[history.length - 1].price;
        const firstPrice = history[0].price;
        const percentageChange = parseFloat((((currentPrice - firstPrice) / firstPrice) * 100).toFixed(2));
        return {
            ticker,
            range,
            currentPrice,
            percentageChange,
            history
        };
    }
    catch (error) {
        console.error(`[MarketDataService] Error fetching data for ${ticker}:`, error.message);
        throw new Error(`Market data unavailable for ${ticker}`);
    }
}
