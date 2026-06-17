/**
 * config.js - Central configuration for Node.js AI Video Generator
 */
const path = require('path');
require('dotenv').config();

const BASE_DIR = __dirname;
const TEMP_DIR = path.join(BASE_DIR, 'temp');

module.exports = {
  // --- TARGET DURATION ---
  TARGET_DURATION_SECONDS: 13 * 60, // 13 minutes exact

  // --- VIDEO SETTINGS ---
  VIDEO_WIDTH: 1920,
  VIDEO_HEIGHT: 1080,
  VIDEO_FPS: 24,
  BITRATE: '8000k',

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
  OUTPUT_DIR: path.join(BASE_DIR, 'output'),
  MEDIA_CACHE_DIR: path.join(TEMP_DIR, 'media_cache'),
  AUDIO_DIR: path.join(TEMP_DIR, 'audio'),
  BG_MUSIC_DIR: path.join(BASE_DIR, 'assets', 'music'),
  FALLBACK_IMAGE: path.join(BASE_DIR, 'assets', 'fallback.jpg'),
};

// Ensure directories exist
const fs = require('fs');
[
  TEMP_DIR,
  path.join(BASE_DIR, 'output'),
  path.join(TEMP_DIR, 'media_cache'),
  path.join(TEMP_DIR, 'audio'),
  path.join(BASE_DIR, 'assets', 'music')
].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
