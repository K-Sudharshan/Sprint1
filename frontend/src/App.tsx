import { useState } from 'react';
import KineticMatrix from '@/components/ui/kinetic-matrix';
import { IntelligenceTrace } from '@/components/ui/intelligence-trace';
import { MarketChart } from '@/components/ui/MarketChart';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { SessionLog, CounterfactualDiff, RiskProfileLevel } from '@/types/models';
import {
  Activity, AlertTriangle, ArrowRight, Box, CheckCircle2,
  ChevronDown, Clock, Cpu, Eye, Info, Layers, LineChart, MessageSquare,
  ShieldAlert, TrendingDown, TrendingUp, XCircle, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function App() {
  const [ticker, setTicker] = useState('RELIANCE');
  const [riskProfile, setRiskProfile] = useState<RiskProfileLevel>('moderate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionLog, setSessionLog] = useState<SessionLog | null>(null);
  const [cfLog, setCfLog] = useState<CounterfactualDiff | null>(null);
  const [targetProfile, setTargetProfile] = useState<RiskProfileLevel>('aggressive');
  const [cfLoading, setCfLoading] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  const handleAnalyze = async () => {
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    setSessionLog(null);
    setCfLog(null);
    setShowTrace(false);

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: ticker.trim().toUpperCase(), riskProfile }),
      });
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(`Server error (${response.status}): ${text || 'Empty response'}`);
        }
        throw new Error('Invalid JSON received from server');
      }

      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status})`);
      }
      setSessionLog(data);
    } catch (err: any) {
      const msg = err.message || 'Unknown error';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ECONNREFUSED')) {
        setError('Cannot connect to the analysis server. Make sure the backend is running (npm run dev) and try again.');
      } else {
        setError(`Analysis failed: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const runCounterfactual = async () => {
    if (!sessionLog) return;
    setCfLoading(true);
    setCfLog(null);
    try {
      const response = await fetch('/api/counterfactual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: sessionLog, targetProfile }),
      });
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(`Server error (${response.status}): ${text || 'Empty response'}`);
        }
        throw new Error('Invalid JSON received from server');
      }
      
      if (!response.ok) throw new Error(data.error || 'API Error');
      setCfLog(data);
    } catch (err: any) {
      console.error('Counterfactual Error:', err);
    } finally {
      setCfLoading(false);
    }
  };

  const getRecommendationColor = (rec?: string) => {
    if (rec === 'buy' || rec === 'add') return 'text-emerald-400 border-emerald-900/50 bg-emerald-950/20';
    if (rec === 'sell' || rec === 'reduce' || rec === 'avoid') return 'text-rose-400 border-rose-900/50 bg-rose-950/20';
    return 'text-amber-400 border-amber-900/50 bg-amber-950/20';
  };

  const getSignalIcon = (signal?: string) => {
    if (['bullish', 'positive', 'supportive'].includes(signal || '')) return <TrendingUp className="size-4 text-emerald-400" />;
    if (['bearish', 'negative', 'cautionary'].includes(signal || '')) return <TrendingDown className="size-4 text-rose-400" />;
    return <Activity className="size-4 text-amber-400" />;
  };

  return (
    <div className="min-h-screen bg-[#020202] text-neutral-200 font-sans selection:bg-neutral-800 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-neutral-900 bg-[#020202]/80 backdrop-blur-md px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md border border-neutral-800 bg-neutral-950">
            <Cpu className="size-5 text-neutral-400" />
          </div>
          <div>
            <h1 className="text-4xl font-serif font-bold italic tracking-tighter text-white leading-none">KALEIDOS</h1>
            <p className="text-[10px] font-sans uppercase tracking-widest text-neutral-500">Multi-Agent Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sessionLog ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-mono uppercase text-neutral-400">Analysis Complete</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full">
                <ShieldAlert className="size-3" />
                <span className="capitalize">{sessionLog.userProfile.riskProfile}</span>
              </div>
            </div>
          ) : (
            <div className={cn("flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1")}>
              <div className={cn("size-2 rounded-full", loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
              <span className="text-[11px] font-mono uppercase text-neutral-400">
                {loading ? 'Analyzing...' : 'System Ready'}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* HERO */}
        <div className="relative w-full border-b border-neutral-900 overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
          <KineticMatrix className="absolute inset-0 opacity-60" />

          <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-6 py-24">
            <div className="mb-6 text-center">
              <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 mb-4">
                Powered by multi-agent AI
              </p>
              <h2 className="text-5xl md:text-6xl font-serif font-bold italic tracking-tight text-white mb-4 leading-tight">
                Initialize Intelligence Network
              </h2>
              <p className="text-base font-sans text-neutral-500 max-w-lg text-center mx-auto">
                Deploy three parallel agents — market signal, sentiment, and fundamental analysis — to synthesize a personalized investment verdict.
              </p>
            </div>

            {/* INPUT CARD */}
            <div className="w-full bg-[#060606]/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 shadow-2xl mt-4">
              <div className="flex flex-col gap-5">
                {/* Ticker Input */}
                <div>
                  <label className="text-xs font-mono uppercase text-neutral-500 mb-2 block tracking-wider">
                    Target Asset
                  </label>
                  <div className="relative">
                    <LineChart className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-600" />
                    <input
                      type="text"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium text-white focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all uppercase tracking-widest placeholder:text-neutral-700"
                      placeholder="e.g. RELIANCE, TCS, INFY"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Risk Profile */}
                <div>
                  <label className="text-xs font-mono uppercase text-neutral-500 mb-2 block tracking-wider">
                    Investor Risk Profile
                  </label>
                  <div className="relative">
                    <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-600" />
                    <select
                      value={riskProfile}
                      onChange={(e) => setRiskProfile(e.target.value as RiskProfileLevel)}
                      disabled={loading}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all appearance-none"
                    >
                      <option value="conservative">Conservative — Capital preservation priority</option>
                      <option value="moderate">Moderate — Balanced risk/reward</option>
                      <option value="aggressive">Aggressive — Maximum upside potential</option>
                    </select>
                  </div>
                </div>

                {/* Error State for API failure */}
                {error && (
                  <div className="flex items-start gap-3 bg-rose-950/20 border border-rose-900/50 rounded-xl p-4">
                    <AlertTriangle className="size-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-400/90 leading-relaxed">{error}</p>
                  </div>
                )}

                {/* Analyze Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !ticker.trim()}
                  className="group relative w-full flex items-center justify-center gap-2.5 bg-neutral-100 text-neutral-950 font-semibold py-4 px-6 rounded-xl hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden text-sm"
                >
                  {loading ? (
                    <>
                      <div className="size-4 border-2 border-neutral-700 border-t-transparent rounded-full animate-spin" />
                      <span>Running Intelligence Network...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="size-4" />
                      <span>Analyze with Intelligence Network</span>
                      <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Agent indicators */}
            <div className="flex items-center gap-6 mt-8">
              {['Market Signal', 'Sentiment', 'Fundamental RAG'].map((agent) => (
                <div key={agent} className="flex items-center gap-2">
                  <div className={cn(
                    "size-1.5 rounded-full",
                    loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500/60"
                  )} />
                  <span className="text-[11px] font-mono text-neutral-600">{agent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RESULTS AREA */}
        {sessionLog && (
          <div className="w-full max-w-5xl px-6 py-12 flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            <ErrorBoundary name="Degraded Mode Banner">
              {sessionLog.metrics.dataCoveragePercent < 100 && (
                <section className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="size-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Limited Intelligence Mode</p>
                      <p className="text-xs text-amber-600 mt-0.5">{sessionLog.synthesisOutput.missing_data_impact}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono uppercase text-amber-700">Data Coverage</span>
                      <span className="text-[11px] font-mono text-amber-500">
                        {sessionLog.metrics.successfulAgents} / {sessionLog.metrics.successfulAgents + sessionLog.metrics.failedAgents} sources
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-700"
                        style={{ width: `${sessionLog.metrics.dataCoveragePercent}%` }}
                      />
                    </div>
                  </div>
                </section>
              )}
            </ErrorBoundary>

            <ErrorBoundary name="Execution Telemetry">
              {sessionLog.metrics.telemetry && sessionLog.metrics.telemetry.length > 0 && (
                <section className="bg-[#050505] border border-neutral-900 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Clock className="size-4 text-neutral-500" />
                    <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-wider">Intelligence Execution</h2>
                    <span className="ml-auto text-[10px] font-mono text-neutral-600 bg-neutral-900 px-2 py-0.5 rounded">PARALLEL</span>
                  </div>
                  <div className="space-y-3 mb-5">
                    {sessionLog.metrics.telemetry.map((t) => {
                      const orStart = Math.min(...sessionLog.metrics.telemetry.map(x => x.startTime));
                      const orEnd = Math.max(...sessionLog.metrics.telemetry.map(x => x.endTime));
                      const orDuration = orEnd - orStart || 1;
                      const left = ((t.startTime - orStart) / orDuration) * 100;
                      const width = Math.max(2, (t.durationMs / orDuration) * 100);
                      return (
                        <div key={t.agentName} className="flex items-center gap-4">
                          <div className="w-36 shrink-0">
                            <span className="text-xs font-mono text-neutral-400">{t.displayName}</span>
                          </div>
                          <div className="flex-1 h-1.5 bg-neutral-900 rounded-full relative">
                            <div
                              className={cn("absolute top-0 h-full rounded-full", t.status === 'success' ? "bg-emerald-500" : "bg-rose-500")}
                              style={{ left: `${left}%`, width: `${width}%` }}
                            />
                          </div>
                          <div className="w-24 text-right flex items-center justify-end gap-2">
                            {t.status === 'success'
                              ? <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                              : <XCircle className="size-3 text-rose-500 shrink-0" />}
                            <span className="text-xs font-mono text-neutral-400">{t.durationMs}ms</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-neutral-900 pt-4 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-[10px] font-mono uppercase text-neutral-600 mb-1">Total Orchestration</p>
                      <p className="text-sm font-semibold text-neutral-200">{sessionLog.metrics.totalOrchestrationMs}ms</p>
                    </div>
                    <div className="text-center border-x border-neutral-900">
                      <p className="text-[10px] font-mono uppercase text-neutral-600 mb-1">Parallel Time Saved</p>
                      <p className="text-sm font-semibold text-emerald-400">
                        {sessionLog.metrics.parallelEfficiencyMs > 0 ? `+${sessionLog.metrics.parallelEfficiencyMs}ms` : '—'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-mono uppercase text-neutral-600 mb-1">Agents</p>
                      <p className="text-sm font-semibold text-neutral-200">
                        {sessionLog.metrics.successfulAgents} ✓
                        {sessionLog.metrics.failedAgents > 0 && (
                          <span className="text-rose-400 ml-1">{sessionLog.metrics.failedAgents} ✗</span>
                        )}
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </ErrorBoundary>

            <ErrorBoundary name="Final Verdict">
              <section className="flex flex-col items-center">
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-6 flex items-center gap-2">
                  <CheckCircle2 className="size-3" />
                  Synthesis Complete
                </p>
                <div className={cn(
                  "flex flex-col items-center p-12 rounded-2xl border bg-gradient-to-b from-neutral-950 to-[#020202] w-full text-center shadow-2xl",
                  getRecommendationColor(sessionLog.synthesisOutput?.recommendation)
                )}>
                  <h3 className="text-xs font-mono uppercase tracking-widest opacity-60 mb-4">Final Verdict · {sessionLog.ticker}</h3>
                  <div className="text-7xl font-black tracking-tighter uppercase mb-6">
                    {sessionLog.synthesisOutput?.recommendation || 'UNKNOWN'}
                  </div>
                  <p className="text-lg md:text-xl font-light text-neutral-300 max-w-2xl leading-relaxed">
                    {sessionLog.synthesisOutput?.explanation || 'No explanation available.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                    <div className="flex items-center gap-2 bg-[#020202] border border-neutral-800 rounded-full px-4 py-1.5">
                      <span className="text-xs text-neutral-500 uppercase">Confidence</span>
                      <span className="text-sm font-medium text-neutral-200">
                        {((sessionLog.synthesisOutput?.confidence || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#020202] border border-neutral-800 rounded-full px-4 py-1.5">
                      <span className="text-xs text-neutral-500 uppercase">Profile</span>
                      <span className="text-sm font-medium text-neutral-200 capitalize">
                        {sessionLog.synthesisOutput?.active_risk_profile}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#020202] border border-neutral-800 rounded-full px-4 py-1.5">
                      <span className="text-xs text-neutral-500 uppercase">Agreement</span>
                      <span className="text-sm font-medium text-neutral-200">
                        {((sessionLog.synthesisOutput?.agent_agreement_score || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </ErrorBoundary>

            <ErrorBoundary name="Personalization Reasoning">
              <section className="bg-[#050505] border border-neutral-900 rounded-xl overflow-hidden">
                <div className="border-b border-neutral-900 px-6 py-4 flex items-center gap-2">
                  <Layers className="size-4 text-indigo-400" />
                  <h2 className="text-sm font-medium text-neutral-300">Personalization Reasoning</h2>
                  <span className="ml-auto text-[10px] font-mono text-neutral-600 capitalize">{sessionLog.synthesisOutput?.active_risk_profile} profile</span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-neutral-900">
                  <div className="pb-4 md:pb-0 md:pr-6">
                    <p className="text-[10px] font-mono uppercase text-neutral-600 mb-2">Base Intelligence Signal</p>
                    <div className={cn("inline-block px-3 py-1.5 text-sm font-bold rounded uppercase border mt-1", getRecommendationColor(sessionLog.synthesisOutput?.base_recommendation))}>
                      {sessionLog.synthesisOutput?.base_recommendation}
                    </div>
                  </div>
                  <div className="py-4 md:py-0 md:px-6">
                    <p className="text-[10px] font-mono uppercase text-neutral-600 mb-2">Profile Constraints Applied</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">{sessionLog.synthesisOutput?.personalization_effect}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {sessionLog.synthesisOutput?.constraints_applied?.map((c, i) => (
                        <span key={i} className="text-[10px] font-mono bg-indigo-950/30 text-indigo-400 border border-indigo-900/40 px-2 py-0.5 rounded">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 md:pt-0 md:pl-6">
                    <p className="text-[10px] font-mono uppercase text-neutral-600 mb-2">Personalized Verdict</p>
                    <div className={cn("inline-block px-3 py-1.5 text-sm font-bold rounded uppercase border mt-1", getRecommendationColor(sessionLog.synthesisOutput?.recommendation))}>
                      {sessionLog.synthesisOutput?.recommendation}
                    </div>
                  </div>
                </div>
              </section>
            </ErrorBoundary>

            <ErrorBoundary name="Market Graph">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-medium text-neutral-300">Market Context</h2>
                </div>
                <MarketChart ticker={sessionLog.ticker} />
              </section>
            </ErrorBoundary>

            <ErrorBoundary name="Agent Perspectives">
              <section>
                <h2 className="text-sm font-medium text-neutral-300 mb-5 flex items-center gap-2">
                  <Box className="size-4 text-neutral-500" />
                  Agent Perspectives
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Market Agent */}
                  <div className={cn("bg-neutral-950 border rounded-xl p-5 flex flex-col", sessionLog.agentOutputs?.marketSignal ? "border-neutral-800" : "border-rose-900/40 bg-rose-950/10")}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-mono uppercase text-neutral-500">Market Signal</div>
                      {sessionLog.agentOutputs?.marketSignal ? getSignalIcon(sessionLog.agentOutputs.marketSignal.signal) : <XCircle className="size-4 text-rose-500" />}
                    </div>
                    {sessionLog.agentOutputs?.marketSignal ? (
                      <>
                        <div className="text-xl font-semibold capitalize mb-2 text-neutral-200">{sessionLog.agentOutputs.marketSignal.signal}</div>
                        <p className="text-sm text-neutral-400 flex-1">{sessionLog.agentOutputs.marketSignal.analysis_summary}</p>
                        <div className="mt-4 pt-4 border-t border-neutral-900 text-xs text-neutral-500">
                          Conf: {(sessionLog.agentOutputs.marketSignal.confidence * 100).toFixed(0)}%
                        </div>
                      </>
                    ) : <p className="text-sm text-rose-400/70 flex-1">Agent failed — excluded from synthesis.</p>}
                  </div>

                  {/* Sentiment Agent */}
                  <div className={cn("bg-neutral-950 border rounded-xl p-5 flex flex-col", sessionLog.agentOutputs?.sentiment ? "border-neutral-800" : "border-rose-900/40 bg-rose-950/10")}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-mono uppercase text-neutral-500">Sentiment</div>
                      {sessionLog.agentOutputs?.sentiment ? getSignalIcon(sessionLog.agentOutputs.sentiment.signal) : <XCircle className="size-4 text-rose-500" />}
                    </div>
                    {sessionLog.agentOutputs?.sentiment ? (
                      <>
                        <div className="text-xl font-semibold capitalize mb-2 text-neutral-200">{sessionLog.agentOutputs.sentiment.signal}</div>
                        <p className="text-sm text-neutral-400 flex-1">{sessionLog.agentOutputs.sentiment.analysis_summary}</p>
                        <div className="mt-4 pt-4 border-t border-neutral-900 text-xs text-neutral-500">
                          Conf: {(sessionLog.agentOutputs.sentiment.confidence * 100).toFixed(0)}%
                        </div>
                      </>
                    ) : <p className="text-sm text-rose-400/70 flex-1">Agent failed — excluded from synthesis.</p>}
                  </div>

                  {/* Fundamental RAG Agent */}
                  <div className={cn("bg-neutral-950 border rounded-xl p-5 flex flex-col", sessionLog.agentOutputs?.fundamentalRag ? "border-neutral-800" : "border-rose-900/40 bg-rose-950/10")}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-mono uppercase text-neutral-500">Fundamental RAG</div>
                      {sessionLog.agentOutputs?.fundamentalRag ? getSignalIcon(sessionLog.agentOutputs.fundamentalRag.signal) : <XCircle className="size-4 text-rose-500" />}
                    </div>
                    {sessionLog.agentOutputs?.fundamentalRag ? (
                      <>
                        <div className="text-xl font-semibold capitalize mb-2 text-neutral-200">{sessionLog.agentOutputs.fundamentalRag.signal}</div>
                        <p className="text-sm text-neutral-400 flex-1">{sessionLog.agentOutputs.fundamentalRag.analysis_summary}</p>
                        <div className="mt-4 pt-4 border-t border-neutral-900 text-xs text-neutral-500">
                          Conf: {(sessionLog.agentOutputs.fundamentalRag.confidence * 100).toFixed(0)}%
                        </div>
                      </>
                    ) : <p className="text-sm text-rose-400/70 flex-1">Agent failed — excluded from synthesis.</p>}
                  </div>
                </div>
              </section>
            </ErrorBoundary>

            <ErrorBoundary name="Evidence and Conflicts">
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#050505] border border-neutral-900 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-500" />
                    Intelligence Conflict
                  </h3>
                  {sessionLog.synthesisOutput?.conflicts_detected && sessionLog.synthesisOutput.conflicts_detected.length > 0 ? (
                    <ul className="space-y-3">
                      {sessionLog.synthesisOutput.conflicts_detected.map((conflict, i) => (
                        <li key={i} className="text-sm text-neutral-400 flex items-start gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800/50">
                          <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span>{conflict}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="h-24 flex items-center justify-center text-sm text-neutral-600 bg-neutral-950 rounded-lg border border-neutral-900 border-dashed">
                      No significant conflicts detected between agents.
                    </div>
                  )}
                </div>

                <div className="bg-[#050505] border border-neutral-900 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
                    <MessageSquare className="size-4 text-blue-500" />
                    Retrieved Evidence
                  </h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {sessionLog.agentOutputs?.fundamentalRag?.retrieved_facts?.map((fact, i) => (
                      <div key={i} className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/50">
                        <p className="text-sm text-neutral-300 mb-2">{fact.claim}</p>
                        <p className="text-[10px] font-mono text-neutral-600 break-all">{fact.citation}</p>
                      </div>
                    ))}
                    {(!sessionLog.agentOutputs?.fundamentalRag?.retrieved_facts || sessionLog.agentOutputs.fundamentalRag.retrieved_facts.length === 0) && (
                      <div className="h-24 flex items-center justify-center text-sm text-neutral-600">
                        No specific evidence retrieved.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </ErrorBoundary>

            <ErrorBoundary name="Counterfactual Simulator">
              <section className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="border-b border-neutral-800 bg-neutral-900/30 p-6">
                  <h3 className="text-lg font-medium text-neutral-200 mb-1 flex items-center gap-2">
                    <Eye className="size-4 text-indigo-400" />
                    Counterfactual Intelligence
                  </h3>
                  <p className="text-sm text-neutral-400 max-w-2xl">
                    Replay the exact same evidence through a different risk constraint to see how the system adapts its reasoning.
                  </p>
                </div>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                    <div className="flex-1 w-full bg-[#020202] border border-neutral-800 rounded-xl p-4 text-center">
                      <div className="text-xs font-mono uppercase text-neutral-500 mb-1">Current Profile</div>
                      <div className="text-lg font-medium text-neutral-200 capitalize">{sessionLog.userProfile?.riskProfile}</div>
                      <div className={cn("inline-block mt-2 px-3 py-1 text-xs font-bold rounded uppercase", getRecommendationColor(sessionLog.synthesisOutput?.recommendation))}>
                        {sessionLog.synthesisOutput?.recommendation}
                      </div>
                    </div>
                    <div className="shrink-0 text-neutral-600">
                      <ArrowRight className="size-6 hidden md:block" />
                      <ChevronDown className="size-6 md:hidden" />
                    </div>
                    <div className="flex-1 w-full bg-[#020202] border border-neutral-800 rounded-xl p-4">
                      <div className="text-xs font-mono uppercase text-neutral-500 mb-2 text-center">Test Alternative</div>
                      <select
                        value={targetProfile}
                        onChange={(e) => setTargetProfile(e.target.value as RiskProfileLevel)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 transition-all appearance-none text-center capitalize"
                      >
                        <option value="conservative">Conservative</option>
                        <option value="moderate">Moderate</option>
                        <option value="aggressive">Aggressive</option>
                      </select>
                      <button
                        onClick={runCounterfactual}
                        disabled={cfLoading || targetProfile === sessionLog.userProfile?.riskProfile}
                        className="w-full mt-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-xs font-medium py-2 rounded transition-colors flex items-center justify-center gap-2"
                      >
                        {cfLoading ? (
                          <>
                            <div className="size-3 border border-neutral-500 border-t-transparent rounded-full animate-spin" />
                            Running Simulation...
                          </>
                        ) : (
                          <>
                            <Zap className="size-3" />
                            Simulate
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {cfLog && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 border-t border-neutral-800 pt-6">
                      <div className="flex flex-col md:flex-row items-start gap-8">
                        <div className="md:w-1/3">
                          <div className="text-xs font-mono uppercase text-neutral-500 mb-3">Simulation Result</div>
                          <div className={cn("inline-block px-4 py-2 text-2xl font-black rounded uppercase border", getRecommendationColor(cfLog.profile_b?.recommendation))}>
                            {cfLog.profile_b?.recommendation}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-mono uppercase text-neutral-500 mb-3">What Changed?</div>
                          <p className="text-neutral-300 text-sm leading-relaxed mb-4 p-4 bg-[#020202] rounded-lg border border-neutral-800">
                            {cfLog.delta_explanation}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {cfLog.changed_factors?.map((factor, i) => (
                              <span key={i} className="text-[11px] bg-indigo-950/30 text-indigo-300 border border-indigo-900/50 px-2.5 py-1 rounded">
                                {factor}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </ErrorBoundary>

            <ErrorBoundary name="Intelligence Trace">
              <section className="border border-neutral-900 rounded-xl overflow-hidden bg-[#050505]">
                <button
                  onClick={() => setShowTrace(!showTrace)}
                  className="w-full flex items-center justify-between p-4 hover:bg-neutral-900/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-400">
                    <Info className="size-4" />
                    Inspect Intelligence Trace
                  </div>
                  <ChevronDown className={cn("size-4 text-neutral-500 transition-transform", showTrace && "rotate-180")} />
                </button>
                {showTrace && <IntelligenceTrace sessionLog={sessionLog} cfLog={cfLog} />}
              </section>
            </ErrorBoundary>

          </div>
        )}
      </main>
    </div>
  );
}
