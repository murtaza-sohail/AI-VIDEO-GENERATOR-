/**
 * audioEngine.js - TTS and Background Music handling
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { EdgeTTS } = require('node-edge-tts');
const config = require('./config');
const { spawn } = require('child_process');
const ffprobeStatic = require('ffprobe-static');
const ffmpegStatic = require('ffmpeg-static');

// node-edge-tts requires options in the constructor
const tts = new EdgeTTS({
  voice: config.TTS_VOICE,
  rate: config.TTS_RATE,
  pitch: config.TTS_PITCH
});

async function generateVoiceover(text, index) {
  const outputPath = path.join(config.AUDIO_DIR, `seg_${String(index).padStart(4, '0')}.mp3`);
  
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
    return outputPath;
  }

  // (Instance now initialized once at top level)

  await tts.ttsPromise(text, outputPath);
  
  return outputPath;
}

async function getAudioDuration(audioPath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn(ffprobeStatic.path, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      audioPath
    ]);
    
    let output = '';
    ffprobe.stdout.on('data', (data) => output += data);
    ffprobe.on('close', (code) => {
      if (code === 0) resolve(parseFloat(output.trim()));
      else resolve(3.0); // fallback
    });
    ffprobe.on('error', () => resolve(5.0));
  });
}

async function generateAllVoiceovers(segments, concurrency = 10) {
  console.log(`🎙️  Generating voiceovers for ${segments.length} segments...`);
  
  for (let i = 0; i < segments.length; i += concurrency) {
    const batch = segments.slice(i, i + concurrency);
    await Promise.all(batch.map(async (seg) => {
      console.log(`   [${seg.index + 1}/${segments.length}] ${seg.text.slice(0, 60)}...`);
      seg.audioPath = await generateVoiceover(seg.text, seg.index);
      seg.audioDuration = await getAudioDuration(seg.audioPath);
    }));
  }

  const total = segments.reduce((acc, s) => acc + s.audioDuration, 0);
  console.log(`✅ Total raw voice duration: ${total.toFixed(1)}s (${(total / 60).toFixed(1)} min)`);
  return segments;
}

async function downloadMusic() {
  const musicPath = path.join(config.BG_MUSIC_DIR, 'background.mp3');
  if (fs.existsSync(musicPath) && fs.statSync(musicPath).size > 50000) return musicPath;

  const urls = [
    "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Ketsa/Raising_Frequency/Ketsa_-_08_-_Raising_Frequency.mp3",
    "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Kai_Engel/Satin/Kai_Engel_-_04_-_Satin.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  ];

  for (let url of urls) {
    try {
      console.log(`   🎵 Fetching background music from ${url.slice(0, 60)}...`);
      const response = await axios({ url, method: 'GET', responseType: 'stream', timeout: 30000 });
      const writer = fs.createWriteStream(musicPath);
      response.data.pipe(writer);
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(musicPath));
        writer.on('error', reject);
      });
    } catch (e) {
      console.log(`   ⚠️  Failed to download music from ${url}`);
    }
  }
  return null;
}

module.exports = { generateAllVoiceovers, downloadMusic, getAudioDuration };
