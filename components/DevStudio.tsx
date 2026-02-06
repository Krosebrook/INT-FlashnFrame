/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import D3FlowChart from './D3FlowChart';
import { DevStudioState, D3Node, ViewMode } from '../types';
import { askNodeSpecificQuestion, performCodeReview, generateTestCases, generateDocumentation, analyzeGapsAndBottlenecks, CodeReviewResult, TestGenerationResult, DocumentationResult, GapAnalysisResult } from '../services/geminiService';
import { Terminal, GitBranch, Cpu, MessageSquare, Zap, Code2, ArrowLeft, Sparkles, Bug, Search, FileCheck, TestTube, FileText, AlertTriangle, Copy, Loader2, Shield, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useProjectContext } from '../contexts/ProjectContext';
import { useRateLimitContext } from '../contexts/RateLimitContext';

type ToolMode = 'chat' | 'review' | 'tests' | 'docs' | 'gaps';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface DevStudioProps {
  onNavigate: (mode: ViewMode) => void;
}

const QUICK_ACTIONS = [
  { label: "Explain", icon: Search, prompt: "Explain the purpose and likely functionality of this component based on its name and connections." },
  { label: "Optimize", icon: Zap, prompt: "Suggest performance optimizations or refactoring for this specific component." },
  { label: "Debug", icon: Bug, prompt: "What are potential failure points, security risks, or bugs common in components like this one?" },
];

const TOOL_MODES = [
  { id: 'chat' as ToolMode, label: 'Chat', icon: MessageSquare, color: 'indigo' },
  { id: 'review' as ToolMode, label: 'Review', icon: FileCheck, color: 'rose' },
  { id: 'tests' as ToolMode, label: 'Tests', icon: TestTube, color: 'green' },
  { id: 'docs' as ToolMode, label: 'Docs', icon: FileText, color: 'blue' },
  { id: 'gaps' as ToolMode, label: 'Gaps', icon: AlertTriangle, color: 'amber' },
];

const DevStudio: React.FC<DevStudioProps> = ({ onNavigate }) => {
  const { currentProject: initialState } = useProjectContext();
  const { handleApiError: handleGlobalRateLimit, checkBeforeCall, isRateLimited, remainingSeconds } = useRateLimitContext();
  const [selectedNode, setSelectedNode] = useState<D3Node | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Tool mode state
  const [toolMode, setToolMode] = useState<ToolMode>('chat');
  const [toolLoading, setToolLoading] = useState(false);
  
  // Tool results
  const [codeReview, setCodeReview] = useState<CodeReviewResult | null>(null);
  const [testResults, setTestResults] = useState<TestGenerationResult | null>(null);
  const [docResults, setDocResults] = useState<DocumentationResult | null>(null);
  const [gapResults, setGapResults] = useState<GapAnalysisResult | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  if (!initialState) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 space-y-6 text-center p-8">
        <div className="p-6 bg-slate-900/50 rounded-full border border-indigo-500/20 shadow-neon-violet">
             <GitBranch className="w-16 h-16 text-indigo-400 opacity-80" />
        </div>
        <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-200 font-sans">Dev Studio Offline</h3>
            <p className="font-mono text-sm max-w-md mx-auto">No repository data is currently loaded into the development environment.</p>
        </div>
        <button 
            onClick={() => onNavigate(ViewMode.REPO_ANALYZER)}
            className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-400 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
            <ArrowLeft className="w-4 h-4" /> Return to Analyzer
        </button>
      </div>
    );
  }

  const handleNodeClick = (node: D3Node) => {
    setSelectedNode(node);
  };

  const executePrompt = async (promptText: string, nodeOverride?: D3Node | null) => {
    if (!initialState.fileTree) return;
    if (checkBeforeCall()) {
      setChatHistory(prev => [...prev, 
        { role: 'user', text: promptText },
        { role: 'model', text: `⏳ Rate limit active. Please wait ${remainingSeconds}s before trying again.` }
      ]);
      return;
    }
    const node = nodeOverride !== undefined ? nodeOverride : selectedNode;
    const targetNodeLabel = node ? node.label : "the overall architecture";

    setChatHistory(prev => [...prev, { role: 'user', text: promptText }]);
    setChatLoading(true);

    try {
        const answer = await askNodeSpecificQuestion(targetNodeLabel, promptText, initialState.fileTree);
        setChatHistory(prev => [...prev, { role: 'model', text: answer }]);
    } catch (error: any) {
        if (handleGlobalRateLimit(error)) {
          setChatHistory(prev => [...prev, { role: 'model', text: "Rate limit reached. Please wait for the cooldown timer above before trying again." }]);
        } else {
          setChatHistory(prev => [...prev, { role: 'model', text: error.message || "Error processing your request." }]);
        }
    } finally {
        setChatLoading(false);
    }
  }

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) return;
    const q = questionInput;
    setQuestionInput('');
    await executePrompt(q);
  };

  const handleQuickAction = (promptTemplate: string) => {
      if (selectedNode) {
         executePrompt(promptTemplate);
      }
  };

  const runTool = async (mode: ToolMode) => {
    if (!initialState?.fileTree || !selectedNode) return;
    if (checkBeforeCall()) {
      setChatHistory(prev => [...prev, 
        { role: 'model', text: `⏳ Rate limit active. Please wait ${remainingSeconds}s before trying again.` }
      ]);
      return;
    }
    
    setToolLoading(true);
    setToolMode(mode);
    
    try {
      switch (mode) {
        case 'review':
          setCodeReview(null);
          const review = await performCodeReview(selectedNode.label, initialState.fileTree);
          setCodeReview(review);
          break;
        case 'tests':
          setTestResults(null);
          const tests = await generateTestCases(selectedNode.label, initialState.fileTree);
          setTestResults(tests);
          break;
        case 'docs':
          setDocResults(null);
          const docs = await generateDocumentation(selectedNode.label, initialState.fileTree);
          setDocResults(docs);
          break;
        case 'gaps':
          setGapResults(null);
          const gaps = await analyzeGapsAndBottlenecks(selectedNode.label, initialState.fileTree);
          setGapResults(gaps);
          break;
      }
    } catch (error: any) {
      if (!handleGlobalRateLimit(error)) {
        console.error("Tool execution failed:", error);
      }
    } finally {
      setToolLoading(false);
    }
  };

  return (
    // Mobile: Flex Column, Desktop: Flex Row. 
    // Mobile: Auto height (stacked), Desktop: Calculated full viewport height
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-180px)] min-h-0 lg:min-h-[600px]">
      
      {/* Left Pane: Interactive Graph */}
      {/* Mobile: Fixed 400px height, Desktop: Flex-1 (fill remaining) */}
      <div className="w-full h-[400px] lg:h-auto lg:flex-1 flex flex-col glass-panel rounded-3xl overflow-hidden">
         <div className="px-4 py-3 bg-slate-950/50 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-300 font-mono uppercase tracking-wider">Live_Dependency_Graph</h3>
            </div>
            <div className="text-xs text-slate-500 font-mono px-2 py-1 bg-white/5 rounded-md hidden sm:block">
                repo: {initialState.repoName}
            </div>
         </div>
         <div className="flex-1 relative w-full h-full">
             <D3FlowChart data={initialState.graphData} onNodeClick={handleNodeClick} />
         </div>
      </div>

      {/* Right Pane: Contextual Dev Terminal */}
      <div className="w-full lg:w-[480px] h-[600px] lg:h-auto glass-panel rounded-3xl flex flex-col overflow-hidden shrink-0 mb-6 lg:mb-0">
         <div className="px-4 py-3 bg-slate-950/50 border-b border-white/5 flex items-center gap-2 shrink-0">
              <Terminal className="w-4 h-4 text-emerald-500/70" />
              <h3 className="text-sm font-mono text-slate-400">dev_assistant --context-aware</h3>
         </div>

         {/* Selected Node Context Header */}
         <div className="bg-slate-950/80 border-b border-white/5 p-3 shrink-0">
             {selectedNode ? (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-1">
                    <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30 shrink-0">
                        <Code2 className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider">Active Node</p>
                        <p className="text-sm text-white font-mono truncate font-medium" title={selectedNode.label}>{selectedNode.label}</p>
                    </div>
                </div>
             ) : (
                 <div className="flex items-center gap-3 opacity-70">
                     <div className="p-2 bg-slate-800 rounded-lg border border-white/5">
                        <Cpu className="w-4 h-4 text-slate-500" />
                     </div>
                     <div>
                         <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Global Scope</p>
                         <p className="text-sm text-slate-400 font-mono">No node selected</p>
                     </div>
                 </div>
             )}
         </div>

         {/* Tool Mode Tabs */}
         <div className="flex bg-slate-950/50 border-b border-white/5 shrink-0">
           {TOOL_MODES.map((tm) => {
             const isActive = toolMode === tm.id;
             const colorStyles: Record<string, { active: string; border: string }> = {
               indigo: { active: 'border-indigo-500 text-indigo-300 bg-indigo-500/10', border: '#6366f1' },
               rose: { active: 'border-rose-500 text-rose-300 bg-rose-500/10', border: '#f43f5e' },
               green: { active: 'border-green-500 text-green-300 bg-green-500/10', border: '#22c55e' },
               blue: { active: 'border-blue-500 text-blue-300 bg-blue-500/10', border: '#3b82f6' },
               amber: { active: 'border-amber-500 text-amber-300 bg-amber-500/10', border: '#f59e0b' },
             };
             const style = colorStyles[tm.color];
             return (
               <button
                 key={tm.id}
                 onClick={() => setToolMode(tm.id)}
                 className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase transition-all border-b-2 ${
                   isActive ? style.active : 'border-transparent text-slate-500 hover:text-slate-300'
                 }`}
               >
                 <tm.icon className="w-3 h-3" />
                 {tm.label}
               </button>
             );
           })}
         </div>

         {/* Tool Content Area */}
         <div className="flex-1 overflow-y-auto bg-slate-950/30 relative min-h-0">
           
           {/* Chat Mode */}
           {toolMode === 'chat' && (
             <>
               {/* Quick Actions */}
               {selectedNode && (
                 <div className="p-3 border-b border-white/5 flex gap-2">
                   {QUICK_ACTIONS.map((action, idx) => (
                     <button
                       key={idx}
                       onClick={() => handleQuickAction(action.prompt)}
                       disabled={chatLoading}
                       className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-indigo-500/20 border border-white/5 hover:border-indigo-500/30 transition-all group disabled:opacity-50"
                     >
                       <action.icon className="w-3 h-3 text-slate-400 group-hover:text-indigo-300" />
                       <span className="text-[10px] font-mono text-slate-500 group-hover:text-indigo-200 uppercase">{action.label}</span>
                     </button>
                   ))}
                 </div>
               )}
               
               <div className="p-4 space-y-4 font-mono text-sm">
                 {chatHistory.length === 0 && !chatLoading && (
                   <div className="flex flex-col items-center justify-center py-12 text-slate-600 space-y-4 text-center opacity-60">
                     <Zap className="w-10 h-10 text-indigo-500/50" />
                     <p className="text-xs max-w-[200px]">Select a node to start chatting</p>
                   </div>
                 )}
                 {chatHistory.map((msg, idx) => (
                   <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[90%] p-3 rounded-xl ${
                       msg.role === 'user' 
                         ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/30 rounded-br-sm' 
                         : 'bg-slate-800/80 text-slate-200 border border-white/10 rounded-bl-sm'
                     }`}>
                       <div className="whitespace-pre-wrap leading-relaxed text-[13px]">{msg.text}</div>
                     </div>
                   </div>
                 ))}
                 {chatLoading && (
                   <div className="flex justify-start">
                     <div className="bg-slate-800/80 p-3 rounded-xl border border-white/10 flex gap-1">
                       <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                       <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                       <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                     </div>
                   </div>
                 )}
                 <div ref={chatEndRef} />
               </div>
             </>
           )}

           {/* Code Review Mode */}
           {toolMode === 'review' && (
             <div className="p-4">
               {!selectedNode ? (
                 <div className="text-center py-12 text-slate-500">
                   <FileCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                   <p className="text-xs font-mono">Select a node to review</p>
                 </div>
               ) : toolLoading ? (
                 <div className="text-center py-12">
                   <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-3" />
                   <p className="text-xs text-rose-300 font-mono">Analyzing code...</p>
                 </div>
               ) : codeReview ? (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-rose-300 font-bold text-sm">Code Review</span>
                     <span className={`text-xl font-bold ${codeReview.overallScore >= 80 ? 'text-green-400' : codeReview.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                       {codeReview.overallScore}/100
                     </span>
                   </div>
                   <p className="text-xs text-slate-400">{codeReview.summary}</p>
                   
                   {codeReview.issues.length > 0 && (
                     <div className="space-y-2">
                       <p className="text-[10px] text-slate-500 font-mono uppercase">Issues ({codeReview.issues.length})</p>
                       {codeReview.issues.map((issue, i) => (
                         <div key={i} className={`p-3 rounded-lg border ${
                           issue.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                           issue.severity === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                           'bg-slate-800/50 border-white/10'
                         }`}>
                           <div className="flex items-center gap-2 mb-1">
                             <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                               issue.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                               issue.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                               'bg-slate-700 text-slate-400'
                             }`}>{issue.severity}</span>
                             <span className="text-[10px] text-slate-500">{issue.category}</span>
                           </div>
                           <p className="text-sm text-white font-medium">{issue.title}</p>
                           <p className="text-xs text-slate-400 mt-1">{issue.description}</p>
                           {issue.suggestion && (
                             <p className="text-xs text-green-400 mt-2 flex items-start gap-1">
                               <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                               {issue.suggestion}
                             </p>
                           )}
                         </div>
                       ))}
                     </div>
                   )}
                   
                   {codeReview.strengths.length > 0 && (
                     <div>
                       <p className="text-[10px] text-slate-500 font-mono uppercase mb-2">Strengths</p>
                       <div className="space-y-1">
                         {codeReview.strengths.map((s, i) => (
                           <div key={i} className="flex items-start gap-2 text-xs text-green-400">
                             <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                             {s}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <button
                     onClick={() => runTool('review')}
                     className="px-6 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl font-mono text-sm border border-rose-500/30 transition-all"
                   >
                     <FileCheck className="w-4 h-4 inline mr-2" />
                     Run Code Review
                   </button>
                 </div>
               )}
             </div>
           )}

           {/* Test Generator Mode */}
           {toolMode === 'tests' && (
             <div className="p-4">
               {!selectedNode ? (
                 <div className="text-center py-12 text-slate-500">
                   <TestTube className="w-10 h-10 mx-auto mb-3 opacity-30" />
                   <p className="text-xs font-mono">Select a node to generate tests</p>
                 </div>
               ) : toolLoading ? (
                 <div className="text-center py-12">
                   <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-3" />
                   <p className="text-xs text-green-300 font-mono">Generating tests...</p>
                 </div>
               ) : testResults ? (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-green-300 font-bold text-sm">Test Cases</span>
                     <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded">{testResults.framework}</span>
                   </div>
                   
                   {testResults.setup && (
                     <div>
                       <p className="text-[10px] text-slate-500 font-mono uppercase mb-2">Setup</p>
                       <div className="relative">
                         <pre className="text-[10px] bg-slate-950 p-3 rounded-lg text-slate-300 font-mono overflow-x-auto max-h-24 overflow-y-auto">{testResults.setup}</pre>
                         <button onClick={() => navigator.clipboard.writeText(testResults.setup)} className="absolute top-2 right-2 p-1 bg-white/10 rounded hover:bg-white/20">
                           <Copy className="w-3 h-3 text-slate-400" />
                         </button>
                       </div>
                     </div>
                   )}
                   
                   {testResults.testCases.map((tc, i) => (
                     <div key={i} className="p-3 bg-slate-800/50 rounded-lg border border-white/5">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-sm text-white font-medium">{tc.name}</span>
                         <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                           tc.type === 'unit' ? 'bg-blue-500/20 text-blue-300' :
                           tc.type === 'integration' ? 'bg-purple-500/20 text-purple-300' :
                           'bg-orange-500/20 text-orange-300'
                         }`}>{tc.type}</span>
                       </div>
                       <p className="text-xs text-slate-400 mb-2">{tc.description}</p>
                       <div className="relative">
                         <pre className="text-[10px] bg-slate-950 p-2 rounded text-slate-300 font-mono overflow-x-auto max-h-32 overflow-y-auto">{tc.code}</pre>
                         <button onClick={() => navigator.clipboard.writeText(tc.code)} className="absolute top-1 right-1 p-1 bg-white/10 rounded hover:bg-white/20">
                           <Copy className="w-3 h-3 text-slate-400" />
                         </button>
                       </div>
                     </div>
                   ))}
                   
                   {testResults.edgeCases.length > 0 && (
                     <div>
                       <p className="text-[10px] text-slate-500 font-mono uppercase mb-2">Edge Cases to Consider</p>
                       <div className="space-y-1">
                         {testResults.edgeCases.map((ec, i) => (
                           <div key={i} className="flex items-start gap-2 text-xs text-orange-400">
                             <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                             {ec}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <button
                     onClick={() => runTool('tests')}
                     className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl font-mono text-sm border border-green-500/30 transition-all"
                   >
                     <TestTube className="w-4 h-4 inline mr-2" />
                     Generate Tests
                   </button>
                 </div>
               )}
             </div>
           )}

           {/* Documentation Mode */}
           {toolMode === 'docs' && (
             <div className="p-4">
               {!selectedNode ? (
                 <div className="text-center py-12 text-slate-500">
                   <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                   <p className="text-xs font-mono">Select a node to generate docs</p>
                 </div>
               ) : toolLoading ? (
                 <div className="text-center py-12">
                   <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                   <p className="text-xs text-blue-300 font-mono">Generating documentation...</p>
                 </div>
               ) : docResults ? (
                 <div className="space-y-4">
                   <div className="text-blue-300 font-bold text-sm">Documentation</div>
                   
                   <div>
                     <p className="text-[10px] text-slate-500 font-mono uppercase mb-2">Module Description</p>
                     <p className="text-sm text-slate-300">{docResults.moduleDoc}</p>
                   </div>
                   
                   {docResults.functions.map((fn, i) => (
                     <div key={i} className="p-3 bg-slate-800/50 rounded-lg border border-white/5">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-sm text-blue-300 font-mono">{fn.name}()</span>
                         <button onClick={() => navigator.clipboard.writeText(fn.jsdoc)} className="p-1 bg-white/10 rounded hover:bg-white/20">
                           <Copy className="w-3 h-3 text-slate-400" />
                         </button>
                       </div>
                       <pre className="text-[10px] bg-slate-950 p-2 rounded text-slate-400 font-mono overflow-x-auto mb-2">{fn.jsdoc}</pre>
                       {fn.params.length > 0 && (
                         <div className="space-y-1">
                           {fn.params.map((p, j) => (
                             <div key={j} className="text-xs">
                               <span className="text-cyan-400">{p.name}</span>
                               <span className="text-slate-500">: {p.type}</span>
                               <span className="text-slate-400"> - {p.description}</span>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   ))}
                   
                   {docResults.usageExamples.length > 0 && (
                     <div>
                       <p className="text-[10px] text-slate-500 font-mono uppercase mb-2">Usage Examples</p>
                       {docResults.usageExamples.map((ex, i) => (
                         <div key={i} className="relative mb-2">
                           <pre className="text-[10px] bg-slate-950 p-2 rounded text-slate-300 font-mono overflow-x-auto">{ex}</pre>
                           <button onClick={() => navigator.clipboard.writeText(ex)} className="absolute top-1 right-1 p-1 bg-white/10 rounded hover:bg-white/20">
                             <Copy className="w-3 h-3 text-slate-400" />
                           </button>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <button
                     onClick={() => runTool('docs')}
                     className="px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl font-mono text-sm border border-blue-500/30 transition-all"
                   >
                     <FileText className="w-4 h-4 inline mr-2" />
                     Generate Docs
                   </button>
                 </div>
               )}
             </div>
           )}

           {/* Gap Analysis Mode */}
           {toolMode === 'gaps' && (
             <div className="p-4">
               {!selectedNode ? (
                 <div className="text-center py-12 text-slate-500">
                   <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                   <p className="text-xs font-mono">Select a node to analyze</p>
                 </div>
               ) : toolLoading ? (
                 <div className="text-center py-12">
                   <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
                   <p className="text-xs text-amber-300 font-mono">Analyzing gaps & bottlenecks...</p>
                 </div>
               ) : gapResults ? (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-amber-300 font-bold text-sm">Gap Analysis</span>
                     <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                       gapResults.overallRisk === 'high' ? 'bg-red-500/20 text-red-300' :
                       gapResults.overallRisk === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                       'bg-green-500/20 text-green-300'
                     }`}>
                       {gapResults.overallRisk.toUpperCase()} RISK
                     </span>
                   </div>
                   <p className="text-xs text-slate-400">{gapResults.summary}</p>
                   
                   {gapResults.gaps.length > 0 && (
                     <div>
                       <p className="text-[10px] text-slate-500 font-mono uppercase mb-2">Gaps ({gapResults.gaps.length})</p>
                       {gapResults.gaps.map((gap, i) => (
                         <div key={i} className={`p-3 rounded-lg border mb-2 ${
                           gap.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
                           gap.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                           'bg-slate-800/50 border-white/10'
                         }`}>
                           <div className="flex items-center gap-2 mb-1">
                             <Shield className="w-3 h-3" />
                             <span className="text-[10px] text-slate-500 uppercase">{gap.type.replace('_', ' ')}</span>
                           </div>
                           <p className="text-sm text-white font-medium">{gap.title}</p>
                           <p className="text-xs text-slate-400 mt-1">{gap.description}</p>
                           <p className="text-xs text-green-400 mt-2">{gap.recommendation}</p>
                         </div>
                       ))}
                     </div>
                   )}
                   
                   {gapResults.bottlenecks.length > 0 && (
                     <div>
                       <p className="text-[10px] text-slate-500 font-mono uppercase mb-2">Bottlenecks</p>
                       {gapResults.bottlenecks.map((bn, i) => (
                         <div key={i} className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30 mb-2">
                           <p className="text-sm text-white font-medium">{bn.title}</p>
                           <p className="text-xs text-slate-400 mt-1">{bn.impact}</p>
                           <p className="text-xs text-green-400 mt-2">{bn.mitigation}</p>
                         </div>
                       ))}
                     </div>
                   )}
                   
                   {gapResults.unknowns.length > 0 && (
                     <div>
                       <p className="text-[10px] text-slate-500 font-mono uppercase mb-2">Unknown Unknowns</p>
                       {gapResults.unknowns.map((unk, i) => (
                         <div key={i} className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30 mb-2">
                           <p className="text-sm text-purple-300 font-medium">{unk.area}</p>
                           <p className="text-xs text-slate-400 mt-1">{unk.concern}</p>
                           <p className="text-xs text-blue-400 mt-2">Investigate: {unk.investigationNeeded}</p>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <button
                     onClick={() => runTool('gaps')}
                     className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl font-mono text-sm border border-amber-500/30 transition-all"
                   >
                     <AlertTriangle className="w-4 h-4 inline mr-2" />
                     Analyze Gaps
                   </button>
                 </div>
               )}
             </div>
           )}
         </div>

        {/* Input Area (only for chat mode) */}
        {toolMode === 'chat' && (
          <div className="p-3 bg-slate-950/80 border-t border-white/5 shrink-0">
                <form onSubmit={handleAskQuestion} className="relative flex items-center glass-panel rounded-xl p-1.5 focus-within:ring-1 ring-indigo-500/50 transition-all bg-black/20">
                  <span className="pl-2 pr-2 text-indigo-500 font-mono flex-shrink-0">{'>'}</span>
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder={selectedNode ? `Query ${selectedNode.label}...` : "Select a node..."}
                    disabled={chatLoading}
                    className="w-full bg-transparent border-none text-slate-200 placeholder:text-slate-600 focus:ring-0 py-1.5 px-0 font-mono text-sm"
                  />
                  <button type="submit" disabled={!questionInput.trim() || chatLoading} className="p-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors disabled:opacity-0 flex-shrink-0">
                      <MessageSquare className="w-4 h-4" />
                  </button>
                </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevStudio;
