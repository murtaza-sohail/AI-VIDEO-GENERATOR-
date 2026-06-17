/**
 * videoAssembler.js - Node.js implementation of video assembly using fluent-ffmpeg
 */
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('ffmpeg-static');
const ffprobeInstaller = require('ffprobe-static');
const path = require('path');
const config = require('./config');

ffmpeg.setFfmpegPath(ffmpegInstaller);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

function computeClipDurations(segments) {
  const BREATH_GAP = 0.6;
  const n = segments.length;
  
  let durations = segments.map(s => Math.max((s.audioDuration || 3.0) + BREATH_GAP, config.MIN_CLIP_DURATION));
  
  let currentTotal = durations.reduce((a, b) => a + b, 0);
  let extra = config.TARGET_DURATION_SECONDS - currentTotal;
  
  if (extra > 0) {
    let weights = durations.map(d => 1.0 / Math.max(d, 0.1));
    let totalW = weights.reduce((a, b) => a + b, 0);
    durations = durations.map((d, i) => d + extra * (weights[i] / totalW));
  }

  // Clamping
  for (let iter = 0; iter < n; iter++) {
    let overflow = 0;
    let freeIndices = [];
    durations.forEach((d, i) => {
      if (d > config.MAX_CLIP_DURATION) {
        overflow += d - config.MAX_CLIP_DURATION;
        durations[i] = config.MAX_CLIP_DURATION;
      } else {
        freeIndices.push(i);
      }
    });
    if (overflow <= 0 || freeIndices.length === 0) break;
    let per = overflow / freeIndices.length;
    freeIndices.forEach(i => durations[i] = Math.min(durations[i] + per, config.MAX_CLIP_DURATION));
  }

  // Final rescale
  currentTotal = durations.reduce((a, b) => a + b, 0);
  let scale = config.TARGET_DURATION_SECONDS / currentTotal;
  durations = durations.map(d => d * scale);

  segments.forEach((s, i) => s.clipDuration = parseFloat(durations[i].toFixed(3)));
  return segments;
}

async function assembleVideo(segments, bgMusicPath, outputFilename = 'motivational_video.mp4') {
  const outputPath = path.join(config.OUTPUT_DIR, outputFilename);
  console.log(`\n🎬 Assembling ${segments.length} clips into ${outputPath}...`);

  const cmd = ffmpeg();

  // 1. Add Filter Graph for Video and Audio
  // We'll build a complex filter string
  let filterStr = "";
  let videoInputs = "";
  let audioMix = "";

  segments.forEach((seg, i) => {
    // Input media
    cmd.input(seg.mediaPath);
    if (seg.mediaType === 'image') {
      cmd.inputOptions(['-loop 1', `-t ${seg.clipDuration}`]);
    } else {
      cmd.inputOptions(['-stream_loop -1', `-t ${seg.clipDuration}`]);
    }

    // Input audio
    cmd.input(seg.audioPath);

    // Video processing: Scale and pad/crop to 1920x1080
    // [i:v] -> scale/crop -> [v_i]
    filterStr += `[${i * 2}:v]scale=${config.VIDEO_WIDTH}:${config.VIDEO_HEIGHT}:force_original_aspect_ratio=increase,crop=${config.VIDEO_WIDTH}:${config.VIDEO_HEIGHT},setsar=1[v${i}];`;
    videoInputs += `[v${i}]`;

    // Audio processing: Delay the voiceover to the start of the clip
    // We'll calculate the cumulative start time
    const startTimeMs = segments.slice(0, i).reduce((acc, s) => acc + s.clipDuration, 0) * 1000;
    filterStr += `[${i * 2 + 1}:a]adelay=${Math.round(startTimeMs)}|${Math.round(startTimeMs)}[a${i}];`;
    audioMix += `[a${i}]`;
  });

  // Background Music
  if (bgMusicPath) {
    const bgIdx = segments.length * 2;
    cmd.input(bgMusicPath).inputOptions(['-stream_loop -1']);
    filterStr += `[${bgIdx}:a]volume=${config.BG_MUSIC_VOLUME}[bgmusic];`;
    audioMix += `[bgmusic]`;
  }

  // Concatenate Videos
  filterStr += `${videoInputs}concat=n=${segments.length}:v=1:a=0[outv];`;

  // Mix Audios
  const totalAudioCount = segments.length + (bgMusicPath ? 1 : 0);
  filterStr += `${audioMix}amix=inputs=${totalAudioCount}:duration=first:dropout_transition=3[outa]`;

  cmd
    .complexFilter(filterStr)
    .outputOptions([
      '-map [outv]',
      '-map [outa]',
      '-c:v libx264',
      '-preset ultrafast',
      '-crf 28',
      '-c:a aac',
      '-b:a 192k',
      '-pix_fmt yuv420p',
      '-t ' + config.TARGET_DURATION_SECONDS
    ])
    .output(outputPath)
    .on('start', (commandLine) => {
      // console.log('Spawned Ffmpeg with command: ' + commandLine);
    })
    .on('progress', (progress) => {
      if (progress.percent) console.log(`   Processing: ${progress.percent.toFixed(1)}% done`);
    })
    .on('error', (err, stdout, stderr) => {
      console.error('An error occurred: ' + err.message);
      // console.error('Stderr: ' + stderr);
    })
    .on('end', () => console.log('✅ Final video rendered!'));

  return new Promise((resolve, reject) => {
    cmd.run();
    cmd.on('end', () => resolve(outputPath));
    cmd.on('error', reject);
  });
}

module.exports = { computeClipDurations, assembleVideo };
