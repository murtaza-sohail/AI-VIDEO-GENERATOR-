/**
 * config.js - Central configuration for Node.js AI Video Generator
 */
const path = require('path');
require('dotenv').config();

const BASE_DIR = __dirname;
const isVercel = process.env.VERCEL === '1';

const TEMP_DIR = isVercel ? path.join('/tmp', 'temp') : path.join(BASE_DIR, 'temp');
const OUTPUT_DIR = isVercel ? path.join('/tmp', 'output') : path.join(BASE_DIR, 'output');
const BG_MUSIC_DIR = isVercel ? path.join('/tmp', 'music') : path.join(BASE_DIR, 'assets', 'music');

module.exports = {
  // --- TARGET DURATION ---
  // On Vercel, we must reduce the duration to 60 seconds maximum to fit in the serverless timeout limit.
  // Otherwise, it will never finish.
  TARGET_DURATION_SECONDS: isVercel ? 60 : 13 * 60, 

  // --- VIDEO SETTINGS ---
  VIDEO_WIDTH: isVercel ? 854 : 1920,
  VIDEO_HEIGHT: isVercel ? 480 : 1080,
  VIDEO_FPS: isVercel ? 15 : 24,
  BITRATE: isVercel ? '1000k' : '8000k',

  // --- AUDIO SETTINGS ---
  AUDIO_SAMPLE_RATE: 44100,
  BG_MUSIC_VOLUME: 0.1, // 10% volume for background music
  VOICE_VOLUME: 1.0,

  // --- TTS (node-edge-tts) ---
  TTS_VOICE: 'en-US-GuyNeural',
  TTS_RATE: '-25%',
  TTS_PITCH: '+0Hz',

  // --- MEDIA SETTINGS ---
  PEXELS_API_KEY: process.env.PEXELS_API_KEY || '',
  PIXABAY_API_KEY: process.env.PIXABAY_API_KEY || '',

  // Clip duration bounds
  MIN_CLIP_DURATION: 4.0,
  MAX_CLIP_DURATION: 90.0,
  TRANSITION_DURATION: 0.8,

  // --- PATHS ---
  BASE_DIR,
  TEMP_DIR,
  OUTPUT_DIR,
  MEDIA_CACHE_DIR: path.join(TEMP_DIR, 'media_cache'),
  AUDIO_DIR: path.join(TEMP_DIR, 'audio'),
  BG_MUSIC_DIR,
  FALLBACK_IMAGE: path.join(BASE_DIR, 'assets', 'fallback.jpg'),
};

// Ensure directories exist
const fs = require('fs');
[
  TEMP_DIR,
  OUTPUT_DIR,
  path.join(TEMP_DIR, 'media_cache'),
  path.join(TEMP_DIR, 'audio'),
  BG_MUSIC_DIR
].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
