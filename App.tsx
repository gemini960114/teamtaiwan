
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Moon, Sun, LogOut, History, Mic, Upload, Plus, Menu, ArrowLeft, X, Loader2, FileAudio, FileJson, FileText, ExternalLink } from 'lucide-react';
import AudioRecorder from './components/AudioRecorder';
import FileUploader from './components/FileUploader';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import Button from './components/Button';
import Auth from './components/Auth';
import JobHistory from './components/JobHistory';

import { AppStatus, AudioData, AuthState, Job } from './types';
import * as storageUtils from './utils/storageUtils';
import * as dbUtils from './utils/dbUtils';
import * as jobProcessor from './services/jobProcessor';

function App() {
  // --- Auth State ---
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    apiKey: null,
    mode: 'session'
  });

  // --- App Logic State ---
  // 'history' view is removed as a main view, it's now a sidebar overlay
  const [view, setView] = useState<'create' | 'result'>('create'); 
  const [mode, setMode] = useState<'record' | 'upload'>('record');
  const [status, setStatus] = useState<AppStatus>('idle');
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Dark Mode Toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // --- Auth Initialization ---
  useEffect(() => {
    const storedKey = storageUtils.getStoredApiKey();
    if (storedKey) {
      setAuth({
        isAuthenticated: true,
        apiKey: storedKey,
        mode: 'persistent'
      });
      refreshJobs(storedKey);
    }
  }, []);

  const refreshJobs = useCallback((key: string) => {
    const list = storageUtils.getJobs(key);
    setJobs(list);
    
    // Check for any currently running jobs or unfinished business
    const active = list.find(j => j.status === 'processing');
    if (active) {
        setStatus('processing');
        setCurrentJob(active);
    }
  }, []);

  // Poll for job updates if processing
  useEffect(() => {
    if (status === 'processing' && auth.apiKey && currentJob?.id) {
      const jobId = currentJob.id;
      const interval = setInterval(() => {
        const freshJobs = storageUtils.getJobs(auth.apiKey!);
        setJobs(freshJobs);
        const updatedCurrent = freshJobs.find(j => j.id === jobId);
        
        if (updatedCurrent) {
            setCurrentJob(updatedCurrent);

            // If we have partial results (segments), switch to view immediately
            if (updatedCurrent.result && updatedCurrent.result.segments.length > 0 && view !== 'result') {
                setView('result');
            }

            if (updatedCurrent.status === 'success') {
                setStatus('success');
                // Ensure view is result (though previous check should catch it)
                if (view !== 'result') setView('result');
            } else if (updatedCurrent.status === 'error') {
                setStatus('error');
                setError(updatedCurrent.error || "Transcription failed");
            }
        } else {
             // Job disappeared?
             console.warn("Current processing job not found in storage.");
             setStatus('error');
             setError("Job not found.");
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [status, auth.apiKey, currentJob?.id, view]); 

  // --- Handlers ---

  const handleLogin = (newAuth: AuthState) => {
    setAuth(newAuth);
    if (newAuth.mode === 'persistent' && newAuth.apiKey) {
      storageUtils.saveApiKey(newAuth.apiKey);
    }
    if (newAuth.apiKey) {
      // Resume any interrupted jobs
      jobProcessor.resumeProcessing(newAuth.apiKey);
      refreshJobs(newAuth.apiKey);
    }
  };

  const handleLogout = () => {
    if (auth.mode === 'persistent') {
      storageUtils.clearStoredApiKey();
    }
    setAuth({ isAuthenticated: false, apiKey: null, mode: 'session' });
    setJobs([]);
    setCurrentJob(null);
    setAudioData(null);
    setView('create');
    setIsSidebarOpen(false);
  };

  const handleAudioReady = (data: AudioData) => {
    setAudioData(data);
    setError(null);
  };

  const handleTranscribe = async () => {
    if (!audioData || !auth.apiKey) return;

    setStatus('processing');
    setError(null);

    try {
        const fileName = audioData.blob instanceof File ? audioData.blob.name : `Recording ${new Date().toLocaleTimeString()}`;
        
        // 1. Create Job
        const newJob = await jobProcessor.createJob(auth.apiKey, fileName, audioData.blob);
        setCurrentJob(newJob);
        refreshJobs(auth.apiKey);
        
        // 2. Start Processing (Async)
        jobProcessor.processJob(auth.apiKey, newJob);

    } catch (err: any) {
        console.error(err);
        setError("Failed to start transcription: " + err.message);
        setStatus('error');
    }
  };

  const handleSelectJob = (job: Job) => {
    setCurrentJob(job);
    setIsSidebarOpen(false); // Close sidebar on selection
    if (job.status === 'success') {
        setStatus('success');
        setView('result');
    } else if (job.status === 'processing') {
        setStatus('processing');
        setView('result');
    }
  };

  const handleDeleteJob = async (job: Job) => {
      if (!auth.apiKey) return;
      
      if (confirm('Are you sure you want to delete this transcript?')) {
          storageUtils.deleteJob(auth.apiKey, job.id);
          await dbUtils.deleteAudioBlob(job.id);
          refreshJobs(auth.apiKey);
          if (currentJob?.id === job.id) {
              setCurrentJob(null);
              setView('create');
          }
      }
  };

  const handleRetryJob = async (job: Job) => {
      if (!auth.apiKey) return;
      await jobProcessor.retryJob(auth.apiKey, job.id);
      setCurrentJob({ ...job, status: 'processing', error: undefined });
      setStatus('processing');
      setView('result');
      setIsSidebarOpen(false);
      refreshJobs(auth.apiKey);
  };

  const handleNewTranscription = () => {
      setAudioData(null);
      setCurrentJob(null);
      setStatus('idle');
      setError(null);
      setView('create');
      setIsSidebarOpen(false);
  };

  // --- Download Handlers ---

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAudio = async () => {
    if (!currentJob?.id) return;
    try {
      const blob = await dbUtils.getAudioBlob(currentJob.id);
      if (blob) {
        const ext = blob.type.includes('mp4') ? 'mp4' : 
                    blob.type.includes('wav') ? 'wav' : 
                    blob.type.includes('mpeg') ? 'mp3' : 'webm';
        triggerDownload(blob, `recording-${new Date().toISOString().slice(0,10)}.${ext}`);
      } else {
        alert("Audio file not found in storage.");
      }
    } catch (e) {
      console.error("Error downloading audio", e);
      alert("Failed to download audio.");
    }
  };

  const handleDownloadFullJson = () => {
    if (!currentJob?.result) return;
    const jsonString = JSON.stringify(currentJob.result, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    triggerDownload(blob, `transcription-full-${new Date().toISOString().slice(0,10)}.json`);
  };

  const handleDownloadCleanJson = () => {
    if (!currentJob?.result) return;
    // Filter out original_transcript
    const cleanSegments = currentJob.result.segments.map(s => ({
        speaker: s.speaker,
        timestamp: s.timestamp,
        semantic_correction: s.semantic_correction,
        emotion: s.emotion
    }));
    
    const cleanData = {
        summary: currentJob.result.summary,
        segments: cleanSegments
    };

    const jsonString = JSON.stringify(cleanData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    triggerDownload(blob, `transcription-corrected-${new Date().toISOString().slice(0,10)}.json`);
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
        <Auth onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Sidebar Drawer */}
      <div 
        className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsSidebarOpen(false)}
        />
        
        {/* Sidebar Content */}
        <div className="absolute left-0 top-0 h-full w-80 max-w-[80vw] bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800">
           <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <Button 
                onClick={() => setIsSidebarOpen(false)}
                variant="secondary"
                className="w-full mb-4 justify-center"
                icon={<ArrowLeft size={18} />}
              >
                Back to Home
              </Button>
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-slate-900 dark:text-white flex items-center">
                    <History size={18} className="mr-2 text-emerald-500" />
                    Recent Jobs
                </h2>
                <button 
                    onClick={handleNewTranscription}
                    className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700 transition-colors flex items-center"
                >
                    <Plus size={14} className="mr-1" /> New
                </button>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-3">
               <JobHistory 
                    jobs={jobs} 
                    onSelectJob={handleSelectJob}
                    onDeleteJob={handleDeleteJob}
                    onRetryJob={handleRetryJob}
                    selectedJobId={currentJob?.id}
                />
           </div>
           
           <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              TeamTaiwan 「聽台灣」智慧會議轉錄
           </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
              title="Menu"
            >
               <Menu size={24} />
            </button>
            
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer" onClick={() => setView('create')}>
                <div className="bg-emerald-500 p-1.5 rounded-lg text-white shadow-sm shrink-0">
                   <Sparkles size={20} fill="currentColor" />
                </div>
                <div className="flex items-center text-base sm:text-xl tracking-tight whitespace-nowrap">
                    <span className="font-bold text-slate-900 dark:text-white mr-1 sm:mr-2">TeamTaiwan</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">「聽台灣」</span>
                </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        
        {view === 'create' && (
            <div className="w-full">
                <div className="text-center mb-8 sm:mb-12 mt-4">
                    <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 tracking-tight">
                        台灣語音，AI 全懂
                    </h2>
                    <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium">
                        精準捕捉台灣在地語音，一鍵生成完整會議紀錄
                    </p>
                </div>

                    {/* Input Selection Tabs */}
                <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex mb-8 max-w-2xl mx-auto">
                    <button
                        onClick={() => { if (status !== 'processing') { setMode('record'); setAudioData(null); } }}
                        disabled={status === 'processing'}
                        className={`flex-1 flex items-center justify-center px-4 sm:px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                        mode === 'record' 
                            ? 'bg-emerald-600 text-white shadow-sm' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        } ${status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Mic size={18} className="mr-2" />
                        <span className="hidden sm:inline">Record Audio</span>
                        <span className="sm:hidden">Record</span>
                    </button>
                    <button
                        onClick={() => { if (status !== 'processing') { setMode('upload'); setAudioData(null); } }}
                        disabled={status === 'processing'}
                        className={`flex-1 flex items-center justify-center px-4 sm:px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                        mode === 'upload' 
                            ? 'bg-emerald-600 text-white shadow-sm' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        } ${status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Upload size={18} className="mr-2" />
                        <span className="hidden sm:inline">Upload File</span>
                        <span className="sm:hidden">Upload</span>
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-12 transition-colors duration-300">
                    {mode === 'record' ? (
                        <AudioRecorder onAudioCaptured={handleAudioReady} disabled={status === 'processing'} />
                    ) : (
                        <FileUploader onFileSelected={handleAudioReady} disabled={status === 'processing'} />
                    )}

                    {audioData && (
                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <Button 
                                onClick={handleTranscribe} 
                                isLoading={status === 'processing'}
                                className="w-full sm:w-auto px-8 py-3 text-lg"
                                icon={<Sparkles size={20} />}
                            >
                                Start Transcription
                            </Button>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400 text-center">
                        {error}
                    </div>
                )}
            </div>
        )}

        {(view === 'result' && currentJob) && (
            <div className="animate-in fade-in duration-300 w-full">
                {status === 'processing' && !currentJob.result ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center">
                        <div className="flex justify-center mb-8">
                            <div className="relative">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-emerald-100 dark:border-emerald-900 border-t-emerald-600 dark:border-t-emerald-500 rounded-full animate-spin"></div>
                                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                    <Sparkles size={24} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
                                </div>
                            </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">Processing "{currentJob.fileName}"</h3>
                        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                            We are splitting the audio, identifying speakers, and generating a polished transcript. This may take a while for long files.
                        </p>
                        <div className="inline-block bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-xs sm:text-sm font-medium">
                            You can close this tab and come back later if you enabled "Keep me logged in".
                        </div>
                    </div>
                ) : status === 'error' ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center">
                            <div className="inline-flex bg-red-100 dark:bg-red-900/30 p-4 rounded-full text-red-600 dark:text-red-400 mb-6">
                            <span className="text-4xl">⚠️</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">Transcription Failed</h3>
                            <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
                            <Button onClick={() => handleRetryJob(currentJob)} variant="secondary">Try Again</Button>
                        </div>
                ) : (
                    <div className="space-y-6">
                        {status === 'processing' && (
                             <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl flex items-center border border-emerald-100 dark:border-emerald-800 animate-pulse">
                                <Loader2 size={18} className="animate-spin mr-2" />
                                <span className="text-sm font-medium">Processing remaining audio chunks... The transcript will update automatically.</span>
                             </div>
                        )}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 gap-4">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">{currentJob.fileName}</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Started on {new Date(currentJob.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                <Button onClick={handleDownloadAudio} variant="secondary" className="text-xs px-3 flex-1 sm:flex-none" icon={<FileAudio size={14}/>}>Audio</Button>
                                {currentJob.result && (
                                    <>
                                        <Button onClick={handleDownloadFullJson} variant="secondary" className="text-xs px-3 flex-1 sm:flex-none" icon={<FileJson size={14}/>}>Full</Button>
                                        <Button onClick={handleDownloadCleanJson} variant="secondary" className="text-xs px-3 flex-1 sm:flex-none" icon={<FileText size={14}/>}>Clean</Button>
                                    </>
                                )}
                                <Button onClick={handleNewTranscription} variant="primary" className="text-xs px-3 flex-1 sm:flex-none" icon={<Plus size={14}/>}>New Job</Button>
                            </div>
                        </div>
                        {currentJob.result && (
                            <TranscriptionDisplay 
                                data={currentJob.result} 
                                isProcessing={status === 'processing'}
                            />
                        )}
                    </div>
                )}
            </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 text-center border-t border-slate-200 dark:border-slate-800">
             <div className="text-xs text-slate-400 dark:text-slate-500">
                <span className="font-medium">Powered by NCHC GenAI Team</span>
                <span className="mx-2">·</span>
                <a href="https://hackmd.io/@whYPD8MBSHWRZV6y-ymFwQ/Sy1d2eN4-l" target="_blank" rel="noreferrer" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center">
                    User Manual <ExternalLink size={10} className="ml-0.5" />
                </a>
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
