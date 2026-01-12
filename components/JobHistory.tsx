
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Job, JobStatus } from '../types';
import { Clock, CheckCircle, AlertTriangle, Loader2, Play, Trash2, FileText, RotateCcw } from 'lucide-react';
import Button from './Button';

interface JobHistoryProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onRetryJob: (job: Job) => void;
  onDeleteJob: (job: Job) => void;
  selectedJobId?: string;
}

const JobHistory: React.FC<JobHistoryProps> = ({ jobs, onSelectJob, onRetryJob, onDeleteJob, selectedJobId }) => {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <p>No transcription history found.</p>
      </div>
    );
  }

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={18} className="text-emerald-500" />;
      case 'processing':
        return <Loader2 size={18} className="text-amber-500 animate-spin" />;
      case 'error':
        return <AlertTriangle size={18} className="text-red-500" />;
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <div 
          key={job.id}
          className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
            selectedJobId === job.id
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
          }`}
        >
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => job.status === 'success' && onSelectJob(job)}
          >
            <div className="flex items-center mb-1">
              <span className="mr-2" title={job.status}>{getStatusIcon(job.status)}</span>
              <h4 className={`font-medium truncate ${selectedJobId === job.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>
                {job.fileName}
              </h4>
            </div>
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 space-x-3 ml-6">
              <span>{formatDate(job.createdAt)}</span>
              {job.duration && <span>~{Math.round(job.duration / 60)} mins</span>}
              {job.error && <span className="text-red-500 truncate max-w-[200px]">{job.error}</span>}
            </div>
          </div>

          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
            {job.status === 'success' && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onSelectJob(job); }}
                 className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                 title="View Transcript"
               >
                 <FileText size={18} />
               </button>
            )}
            
            {job.status === 'error' && (
              <button 
                onClick={(e) => { e.stopPropagation(); onRetryJob(job); }}
                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg dark:text-amber-400 dark:hover:bg-amber-900/30"
                title="Retry Job"
              >
                <RotateCcw size={18} />
              </button>
            )}

            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteJob(job); }}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20 transition-colors"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobHistory;
