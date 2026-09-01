import { useState } from 'react';
import { ChevronDown, Code, FileText, Database, ShieldAlert, Layers } from 'lucide-react';
import type { SessionLog, CounterfactualDiff } from '@/types/models';
import { cn } from '@/lib/utils';

// Helper component for Syntax Highlighting
const CodeViewer = ({ data, defaultOpen = false }: { data: any, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!data) return null;

  const json = JSON.stringify(data, null, 2);
  const highlighted = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
    let cls = 'text-amber-400';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) cls = 'text-indigo-400 font-medium';
      else cls = 'text-emerald-400';
    } else if (/true|false/.test(match)) cls = 'text-blue-400';
    else if (/null/.test(match)) cls = 'text-rose-400';
    return `<span class="${cls}">${match}</span>`;
  });

  return (
    <div className="mt-4 border border-neutral-900 rounded-lg overflow-hidden bg-black">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-neutral-950 hover:bg-neutral-900 transition-colors border-b border-neutral-900"
      >
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <Code className="size-3" />
          {isOpen ? 'Hide Raw JSON' : 'View Raw JSON'}
        </div>
        <ChevronDown className={cn("size-3 text-neutral-500 transition-transform", isOpen && "rotate-180")} />
      </button>
      
      {isOpen && (
        <pre 
          className="text-[11px] font-mono leading-relaxed p-4 overflow-x-auto overflow-y-auto max-h-[350px] custom-scrollbar text-neutral-300"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      )}
    </div>
  );
};

export function IntelligenceTrace({ sessionLog, cfLog }: { sessionLog: SessionLog, cfLog: CounterfactualDiff | null }) {
  const [activeTab, setActiveTab] = useState<'agents' | 'evidence' | 'synthesis' | 'cf' | 'meta'>('agents');

  const tabs = [
    { id: 'agents', label: 'Agent Outputs', icon: <Layers className="size-3" /> },
    { id: 'evidence', label: 'Retrieved Evidence', icon: <Database className="size-3" /> },
    { id: 'synthesis', label: 'Synthesis', icon: <FileText className="size-3" /> },
    { id: 'cf', label: 'Counterfactual', icon: <ShieldAlert className="size-3" /> },
    { id: 'meta', label: 'Execution Metadata', icon: <Code className="size-3" /> },
  ] as const;

  const renderAgentSummary = (title: string, agent: any) => {
    if (!agent) return null;
    return (
      <div className="mb-6 p-5 border border-neutral-800 rounded-xl bg-[#060606]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-200">{title}</h4>
            <div className="text-xs text-neutral-500 font-mono mt-1 capitalize">
              {agent.signal} · {(agent.confidence * 100).toFixed(0)}% Confidence
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-mono uppercase text-neutral-600 mb-1">Analysis Summary</div>
            <p className="text-sm text-neutral-300 leading-relaxed">{agent.analysis_summary}</p>
          </div>
          
          {(agent.key_evidence || agent.risk_factors) && (
            <div>
              <div className="text-[10px] font-mono uppercase text-neutral-600 mb-1">Key Evidence & Risks</div>
              <ul className="text-sm text-neutral-400 space-y-1">
                {agent.key_evidence?.map((e: string, i: number) => <li key={`e-${i}`} className="flex gap-2"><span className="text-emerald-500 shrink-0">+</span><span>{e}</span></li>)}
                {agent.risk_factors?.map((r: string, i: number) => <li key={`r-${i}`} className="flex gap-2"><span className="text-rose-500 shrink-0">-</span><span>{r}</span></li>)}
              </ul>
            </div>
          )}

          {agent.uncertainty && (
            <div>
              <div className="text-[10px] font-mono uppercase text-neutral-600 mb-1">Uncertainty</div>
              <p className="text-sm text-neutral-400 italic">{agent.uncertainty}</p>
            </div>
          )}
        </div>

        <CodeViewer data={agent} />
      </div>
    );
  };

  return (
    <div className="flex flex-col border-t border-neutral-900 bg-[#020202]">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-neutral-900 custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-xs font-mono uppercase transition-colors whitespace-nowrap",
              activeTab === tab.id 
                ? "text-neutral-100 border-b-2 border-neutral-300 bg-neutral-900/30" 
                : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-950"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-6">
        
        {/* AGENTS TAB */}
        {activeTab === 'agents' && (
          <div className="animate-in fade-in duration-300">
            {renderAgentSummary('Market Signal Agent', sessionLog.agentOutputs.marketSignal)}
            {renderAgentSummary('Sentiment Intelligence Agent', sessionLog.agentOutputs.sentiment)}
            {renderAgentSummary('Fundamental / RAG Agent', sessionLog.agentOutputs.fundamentalRag)}
          </div>
        )}

        {/* EVIDENCE TAB */}
        {activeTab === 'evidence' && (
          <div className="animate-in fade-in duration-300">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-200 mb-4">Retrieved Documents</h4>
            
            {sessionLog.agentOutputs.fundamentalRag?.retrieved_facts?.length ? (
              <div className="space-y-3">
                {sessionLog.agentOutputs.fundamentalRag.retrieved_facts.map((fact, i) => (
                  <div key={i} className="p-4 border border-neutral-800 rounded-lg bg-[#060606]">
                    <div className="text-[10px] font-mono uppercase text-neutral-600 mb-2">Claim {i + 1}</div>
                    <p className="text-sm text-neutral-300 mb-3">{fact.claim}</p>
                    <div className="text-[10px] font-mono uppercase text-neutral-600 mb-1">Citation</div>
                    <p className="text-xs text-neutral-500 break-all">{fact.citation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 italic mb-4">No specific documents retrieved for this session.</p>
            )}
            
            <CodeViewer data={sessionLog.agentOutputs.fundamentalRag?.retrieved_facts} />
          </div>
        )}

        {/* SYNTHESIS TAB */}
        {activeTab === 'synthesis' && (
          <div className="animate-in fade-in duration-300">
            <div className="p-5 border border-neutral-800 rounded-xl bg-[#060606] mb-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-200 mb-4">Synthesis Details</h4>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-[10px] font-mono uppercase text-neutral-600 mb-1">Final Recommendation</div>
                  <div className="text-lg uppercase text-neutral-200 font-bold">{sessionLog.synthesisOutput.recommendation}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-neutral-600 mb-1">Overall Confidence</div>
                  <div className="text-lg text-neutral-200 font-bold">{(sessionLog.synthesisOutput.confidence * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-neutral-600 mb-1">Agent Agreement</div>
                  <div className="text-lg text-neutral-200 font-bold">{(sessionLog.synthesisOutput.agent_agreement_score * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-neutral-600 mb-1">Target Profile</div>
                  <div className="text-lg text-neutral-200 capitalize font-bold">{sessionLog.synthesisOutput.active_risk_profile}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-[10px] font-mono uppercase text-neutral-600 mb-1">Decision Rationale</div>
                <p className="text-sm text-neutral-300 leading-relaxed">{sessionLog.synthesisOutput.explanation}</p>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase text-neutral-600 mb-2">Constraints Applied</div>
                <div className="flex flex-wrap gap-2">
                  {sessionLog.synthesisOutput.constraints_applied.map((c, i) => (
                    <span key={i} className="text-[11px] bg-neutral-900 border border-neutral-800 text-neutral-300 px-2 py-1 rounded">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <CodeViewer data={sessionLog.synthesisOutput} />
          </div>
        )}

        {/* COUNTERFACTUAL TAB */}
        {activeTab === 'cf' && (
          <div className="animate-in fade-in duration-300">
            {cfLog ? (
              <div className="p-5 border border-neutral-800 rounded-xl bg-[#060606] mb-6">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-200 mb-6">Simulation Differences</h4>
                
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 bg-black border border-neutral-900 rounded-lg p-4">
                    <div className="text-[10px] font-mono uppercase text-neutral-600 mb-1">Original ({cfLog.profile_a.profile})</div>
                    <div className="text-xl uppercase font-bold text-neutral-300">{cfLog.profile_a.recommendation}</div>
                  </div>
                  <div className="flex-1 bg-black border border-neutral-900 rounded-lg p-4">
                    <div className="text-[10px] font-mono uppercase text-neutral-600 mb-1">Alternative ({cfLog.profile_b.profile})</div>
                    <div className="text-xl uppercase font-bold text-neutral-300">{cfLog.profile_b.recommendation}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-[10px] font-mono uppercase text-neutral-600 mb-1">What Changed</div>
                  <p className="text-sm text-neutral-300 leading-relaxed">{cfLog.delta_explanation}</p>
                </div>
                
                <CodeViewer data={cfLog} />
              </div>
            ) : (
              <p className="text-sm text-neutral-500 italic mb-4">No counterfactual simulation run for this session yet.</p>
            )}
          </div>
        )}

        {/* METADATA TAB */}
        {activeTab === 'meta' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-200 mb-2">Execution Metadata</h4>
              <p className="text-sm text-neutral-500">System latencies, timestamps, and unstructured session state.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {sessionLog.metrics?.telemetry?.map((t) => (
                <div key={t.agentName} className="p-3 border border-neutral-900 rounded bg-black">
                  <div className="text-[10px] font-mono text-neutral-600 mb-1">{t.displayName} Duration</div>
                  <div className={`text-sm ${t.status === 'success' ? 'text-neutral-300' : 'text-rose-400'}`}>{t.durationMs}ms</div>
                </div>
              ))}
              <div className="p-3 border border-neutral-900 rounded bg-black">
                <div className="text-[10px] font-mono text-neutral-600 mb-1">Total Orchestration</div>
                <div className="text-sm font-bold text-neutral-200">{sessionLog.metrics.totalOrchestrationMs}ms</div>
              </div>
            </div>

            <CodeViewer data={sessionLog} defaultOpen={true} />
          </div>
        )}
      </div>
    </div>
  );
}
