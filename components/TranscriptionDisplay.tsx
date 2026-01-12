
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { TranscriptionResponse, Emotion } from '../types';
import { User, Clock, Smile, Frown, AlertCircle, Meh, Wand2, Quote, Loader2, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TranscriptionDisplayProps {
  data: TranscriptionResponse;
  isProcessing?: boolean;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ data, isProcessing }) => {
  const [copied, setCopied] = useState(false);

  const getEmotionBadge = (emotion?: Emotion) => {
    if (!emotion) return null;

    switch (emotion) {
      case Emotion.Happy:
        return (
          <div className="flex items-center bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-800 text-xs font-medium">
            <Smile size={12} className="mr-1" />
            {emotion}
          </div>
        );
      case Emotion.Sad:
        return (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-100 dark:border-blue-800 text-xs font-medium">
            <Frown size={12} className="mr-1" />
            {emotion}
          </div>
        );
      case Emotion.Angry:
        return (
          <div className="flex items-center bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded border border-red-100 dark:border-red-800 text-xs font-medium">
            <AlertCircle size={12} className="mr-1" />
            {emotion}
          </div>
        );
      case Emotion.Neutral:
      default:
        return (
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 text-xs font-medium">
            <Meh size={12} className="mr-1" />
            {emotion}
          </div>
        );
    }
  };

  const handleCopySummary = async () => {
    if (!data.summary) return;
    try {
      await navigator.clipboard.writeText(data.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Summary Section */}
      <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-900 border border-emerald-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300 relative group">
        <div className="flex justify-between items-start mb-3">
            <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200 flex items-center">
                <Wand2 size={20} className="mr-2" />
                Executive Summary
            </h2>
            
            {data.summary && (
                <button 
                    onClick={handleCopySummary}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-emerald-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                    title="Copy Summary"
                >
                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
            )}
        </div>

        {isProcessing && !data.summary ? (
             <div className="flex items-center justify-center py-6 text-slate-500 dark:text-slate-400">
                <Loader2 size={20} className="animate-spin mr-3 text-emerald-600" />
                <span className="text-sm font-medium">Generating summary after all audio chunks are processed...</span>
             </div>
        ) : (
             <div className="text-slate-700 dark:text-slate-300 leading-relaxed markdown-body">
                <ReactMarkdown>{data.summary || "No summary available."}</ReactMarkdown>
             </div>
        )}
      </div>

      {/* Segments Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white px-1 flex justify-between items-center">
            <span>Detailed Transcript</span>
            {isProcessing && (
                <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full animate-pulse">
                    Live Updating...
                </span>
            )}
        </h2>
        
        {data.segments.length === 0 && isProcessing && (
             <div className="text-center py-10 text-slate-500">
                 <Loader2 size={30} className="animate-spin mx-auto mb-3 opacity-50" />
                 <p>Transcribing audio segments...</p>
             </div>
        )}

        {data.segments.map((segment, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                <User size={14} className="mr-1.5" />
                {segment.speaker}
              </div>
              <div className="flex items-center font-mono text-xs bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded border border-slate-100 dark:border-slate-600">
                <Clock size={12} className="mr-1.5" />
                {segment.timestamp}
              </div>
              {segment.emotion && getEmotionBadge(segment.emotion)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Transcript */}
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                        <Quote size={12} className="mr-1" /> Original
                    </h4>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-lg font-serif">
                        {segment.original_transcript}
                    </p>
                </div>

                {/* Semantic Correction */}
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                     <h4 className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center">
                        <Wand2 size={12} className="mr-1" /> Polished
                    </h4>
                    <p className="text-emerald-900 dark:text-emerald-100 leading-relaxed">
                        {segment.semantic_correction}
                    </p>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TranscriptionDisplay;
