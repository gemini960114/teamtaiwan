
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { AUDIO_SAMPLE_RATE, CHUNK_DURATION_SECONDS } from "../constants";

export { CHUNK_DURATION_SECONDS }; // Re-export for use in other files if needed

/**
 * Decodes audio file, resamples to 16kHz mono, and returns the AudioBuffer.
 */
export async function decodeAndResample(audioBlob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: AUDIO_SAMPLE_RATE,
  });
  
  // decodeAudioData automatically resamples if the context sampleRate differs
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // We strictly want mono for efficiency
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer;
  }

  // Mix down to mono
  const offlineContext = new OfflineAudioContext(1, audioBuffer.length, AUDIO_SAMPLE_RATE);
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();
  return await offlineContext.startRendering();
}

/**
 * Encodes an AudioBuffer to a WAV Blob.
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1; // We force mono
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const data = buffer.getChannelData(0);
  const dataSize = data.length * 2; // 16-bit = 2 bytes per sample
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  
  const bufferArr = new ArrayBuffer(totalSize);
  const view = new DataView(bufferArr);
  
  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  
  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  view.setUint16(32, numChannels * 2, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample
  
  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Splits an AudioBuffer into multiple AudioBuffers based on duration.
 */
export function splitAudioBuffer(buffer: AudioBuffer, chunkSeconds: number = CHUNK_DURATION_SECONDS): AudioBuffer[] {
  const chunks: AudioBuffer[] = [];
  const samplesPerChunk = chunkSeconds * buffer.sampleRate;
  const totalSamples = buffer.length;
  
  for (let start = 0; start < totalSamples; start += samplesPerChunk) {
    const end = Math.min(start + samplesPerChunk, totalSamples);
    const length = end - start;
    
    const chunkBuffer = new AudioBuffer({
      length: length,
      numberOfChannels: 1,
      sampleRate: buffer.sampleRate
    });
    
    chunkBuffer.copyToChannel(buffer.getChannelData(0).subarray(start, end), 0);
    chunks.push(chunkBuffer);
  }
  
  return chunks;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
