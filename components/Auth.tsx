
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { Sparkles, Key, ArrowRight, AlertCircle, ExternalLink } from 'lucide-react';
import { validateApiKey } from '../services/geminiService';
import { AuthState } from '../types';
import { INVITATION_CODE } from '../constants';

interface AuthProps {
  onLogin: (state: AuthState) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [code, setCode] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validate Invitation Code
    if (code !== INVITATION_CODE) {
      setError("Invalid invitation code.");
      return;
    }

    // 2. Validate API Key Format
    if (!apiKey.trim()) {
        setError("Please enter your API Key.");
        return;
    }
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
      setError("Invalid API Key format. It should start with 'AIza'.");
      return;
    }

    setIsLoading(true);
    
    // 3. Live Validation
    const isValid = await validateApiKey(apiKey);
    
    setIsLoading(false);

    if (isValid) {
      onLogin({
        isAuthenticated: true,
        apiKey,
        mode: keepLoggedIn ? 'persistent' : 'session'
      });
    } else {
      setError("Validation failed. Please check if the key is active and has Gemini API enabled.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:py-12">
      <div className="max-w-[480px] w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        
        <div className="p-6 sm:p-10">
          {/* Header Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-full text-emerald-600 dark:text-emerald-400 shadow-sm">
               <Sparkles size={32} />
            </div>
          </div>
          
          {/* Title Section */}
          <div className="text-center mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
              TeamTaiwan
            </h1>
            <h2 className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-3 tracking-tight">
              「聽台灣」智慧會議轉錄
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              精準捕捉台灣在地語音，一鍵生成完整會議紀錄
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-start text-sm text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={16} />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Invitation Code Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Invitation Code
              </label>
              <input
                type="text" // Changed to text so user can see what they type, or keep password if preferred
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                placeholder="Enter invitation code"
              />
            </div>

            {/* API Key Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Gemini API Key
                </label>
                <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center transition-colors"
                >
                    Get key <ExternalLink size={12} className="ml-1" />
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={18} className="text-slate-400" />
                </div>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                    placeholder="AIza..."
                />
              </div>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                Your key is used locally and sent directly to Google servers.
              </p>
            </div>

            {/* Keep Logged In Checkbox */}
            <div className="flex items-center pt-1">
              <input
                id="keep-logged-in"
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="keep-logged-in" className="ml-2 block text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                Keep me logged in
              </label>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                    </>
                ) : (
                    <>
                        Access System <ArrowRight size={20} className="ml-2" />
                    </>
                )}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="pb-8 pt-0 text-center">
             <div className="text-xs text-slate-400 dark:text-slate-500">
                <span className="font-medium">Powered by NCHC GenAI Team</span>
                <span className="mx-2">·</span>
                <a href="https://hackmd.io/@whYPD8MBSHWRZV6y-ymFwQ/Sy1d2eN4-l" target="_blank" rel="noreferrer" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center">
                    User Manual <ExternalLink size={10} className="ml-0.5" />
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
