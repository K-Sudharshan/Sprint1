import YahooFinance from 'yahoo-finance2';

async function test() {
  try {
    const yahooFinance = new YahooFinance();
    const ticker = 'RELIANCE.NS';
    console.log('Querying:', ticker);
    
    const now = new Date();
    const period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 1M
    const interval = '1d';

    const result = await yahooFinance.chart(ticker, { period1, interval });
    console.log('Result quotes length:', result.quotes?.length);
    if (result.quotes && result.quotes.length > 0) {
      console.log('First quote:', result.quotes[0]);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
