
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Job } from '../types';
import { STORAGE_AUTH_KEY } from '../constants';

// Simple string hash to isolate user data based on their API key
function hashKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

function getJobStorageKey(apiKey: string): string {
  return `echoScript_jobs_${hashKey(apiKey)}`;
}

// Authentication
export function getStoredApiKey(): string | null {
  try {
    const encoded = localStorage.getItem(STORAGE_AUTH_KEY);
    if (!encoded) return null;
    return atob(encoded);
  } catch (e) {
    console.error("Failed to decode stored API key", e);
    return null;
  }
}

export function saveApiKey(apiKey: string) {
  localStorage.setItem(STORAGE_AUTH_KEY, btoa(apiKey));
}

export function clearStoredApiKey() {
  localStorage.removeItem(STORAGE_AUTH_KEY);
}

// Job Management
export function getJobs(apiKey: string): Job[] {
  try {
    const json = localStorage.getItem(getJobStorageKey(apiKey));
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error("Failed to load jobs", e);
    return [];
  }
}

export function saveJob(apiKey: string, job: Job) {
  const jobs = getJobs(apiKey);
  const existingIndex = jobs.findIndex(j => j.id === job.id);
  
  if (existingIndex >= 0) {
    jobs[existingIndex] = job;
  } else {
    // Add new job to the top
    jobs.unshift(job);
  }
  
  localStorage.setItem(getJobStorageKey(apiKey), JSON.stringify(jobs));
}

export function deleteJob(apiKey: string, jobId: string) {
  const jobs = getJobs(apiKey).filter(j => j.id !== jobId);
  localStorage.setItem(getJobStorageKey(apiKey), JSON.stringify(jobs));
}
