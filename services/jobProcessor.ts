
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { v4 as uuidv4 } from 'uuid';
import { Job, TranscriptionSegment, TranscriptionResponse } from '../types';
import * as audioUtils from '../utils/audioUtils';
import * as dbUtils from '../utils/dbUtils';
import * as storageUtils from '../utils/storageUtils';
import * as geminiService from './geminiService';
import { API_RETRY_ATTEMPTS, API_RETRY_BASE_DELAY_MS } from '../constants';

export const createJob = async (apiKey: string, fileName: string, audioBlob: Blob): Promise<Job> => {
    const id = uuidv4();
    const job: Job = {
        id,
        fileName,
        createdAt: Date.now(),
        status: 'processing',
    };

    // 1. Save Blob to IndexedDB
    await dbUtils.saveAudioBlob(id, audioBlob);
    
    // 2. Save Job Meta to LocalStorage
    storageUtils.saveJob(apiKey, job);

    return job;
};

export const processJob = async (apiKey: string, job: Job): Promise<void> => {
    try {
        // Retrieve Audio
        const audioBlob = await dbUtils.getAudioBlob(job.id);
        if (!audioBlob) throw new Error("Audio file not found in storage.");

        // Preprocessing: Decode, Resample, Split
        const audioBuffer = await audioUtils.decodeAndResample(audioBlob);
        const chunks = audioUtils.splitAudioBuffer(audioBuffer);
        
        let allSegments: TranscriptionSegment[] = [];
        let previousContext = "";

        // Process Chunks Sequentially
        for (let i = 0; i < chunks.length; i++) {
            const chunkWav = audioUtils.audioBufferToWav(chunks[i]);
            const base64 = await audioUtils.blobToBase64(chunkWav);
            
            // Retry logic for API calls
            let retries = 0;
            let success = false;
            let chunkData;
            
            while (!success && retries < API_RETRY_ATTEMPTS) {
                try {
                    chunkData = await geminiService.transcribeChunk(apiKey, base64, 'audio/wav', previousContext);
                    success = true;
                } catch (e) {
                    retries++;
                    console.warn(`Chunk ${i} failed, retrying (${retries}/${API_RETRY_ATTEMPTS})...`, e);
                    await new Promise(r => setTimeout(r, API_RETRY_BASE_DELAY_MS * Math.pow(2, retries))); // Exponential backoff
                }
            }
            
            if (!success || !chunkData) throw new Error(`Failed to transcribe chunk ${i} after retries.`);

            // Time Offset Correction
            const offsetSeconds = i * audioUtils.CHUNK_DURATION_SECONDS;
            const adjustedSegments = chunkData.segments.map(seg => {
                // Parse timestamp MM:SS
                let timestampStr = seg.timestamp;
                // Basic check if timestamp format is correct
                if (!timestampStr.includes('-')) {
                    timestampStr = `${timestampStr} - ${timestampStr}`;
                }
                
                const [start, end] = timestampStr.split('-').map(t => {
                    const parts = t.trim().split(':');
                    const mins = parseInt(parts[0] || "0");
                    const secs = parseInt(parts[1] || "0");
                    const totalSecs = mins * 60 + secs + offsetSeconds;
                    const newMins = Math.floor(totalSecs / 60);
                    const newSecs = totalSecs % 60;
                    return `${newMins.toString().padStart(2, '0')}:${newSecs.toString().padStart(2, '0')}`;
                });
                return { ...seg, timestamp: `${start} - ${end}` };
            });

            allSegments = [...allSegments, ...adjustedSegments];
            
            // Update Context for next chunk (last sentence of current chunk)
            if (adjustedSegments.length > 0) {
                previousContext = adjustedSegments[adjustedSegments.length - 1].original_transcript;
            }

            // --- SAVE PARTIAL PROGRESS ---
            // We update the job in storage with the segments we have so far.
            // Summary is left empty to indicate it is pending.
            const partialResult: TranscriptionResponse = {
                summary: "", 
                segments: allSegments
            };
            
            const partialJob: Job = {
                ...job,
                result: partialResult,
                status: 'processing', // Still processing
                duration: audioBuffer.duration
            };
            storageUtils.saveJob(apiKey, partialJob);
        }

        // Generate Summary after all chunks are done
        const fullText = allSegments.map(s => `${s.speaker}: ${s.original_transcript}`).join('\n');
        const summary = await geminiService.generateSummary(apiKey, fullText);

        const result: TranscriptionResponse = {
            summary,
            segments: allSegments
        };

        // Update Job Status to Success
        const updatedJob: Job = {
            ...job,
            status: 'success',
            result,
            duration: audioBuffer.duration
        };
        storageUtils.saveJob(apiKey, updatedJob);

    } catch (error: any) {
        console.error("Job Processing Failed", error);
        const failedJob: Job = {
            ...job,
            status: 'error',
            error: error.message || "Unknown error occurred"
        };
        storageUtils.saveJob(apiKey, failedJob);
    }
};

export const resumeProcessing = async (apiKey: string) => {
    const jobs = storageUtils.getJobs(apiKey);
    const processingJobs = jobs.filter(j => j.status === 'processing');
    
    // Mark interrupted jobs as error so user can manually retry
    for (const job of processingJobs) {
        const updated: Job = { ...job, status: 'error', error: 'Interrupted (Browser closed or crashed). Retry to resume.' };
        storageUtils.saveJob(apiKey, updated);
    }
};

export const retryJob = async (apiKey: string, jobId: string) => {
    const jobs = storageUtils.getJobs(apiKey);
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    // Reset status
    const retryingJob: Job = { ...job, status: 'processing', error: undefined };
    storageUtils.saveJob(apiKey, retryingJob);
    
    // Run process
    await processJob(apiKey, retryingJob);
};
