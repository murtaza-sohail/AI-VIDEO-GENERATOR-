/**
 * mediaFetcher.js - Stock media retrieval
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const config = require('./config');

const AXIOS_CONFIG = {
  headers: { 'User-Agent': 'AIVideoGen/1.0' },
  timeout: 20000
};

async function searchPexels(query, type = 'photos') {
  if (!config.PEXELS_API_KEY) return [];
  const url = `https://api.pexels.com/${type === 'videos' ? 'videos' : 'v1'}/search`;
  try {
    const res = await axios.get(url, {
      params: { query, per_page: 5, orientation: 'landscape' },
      headers: { Authorization: config.PEXELS_API_KEY }
    });
    if (type === 'videos') {
      return res.data.videos.map(v => {
        const file = v.video_files.sort((a, b) => b.height - a.height).find(f => f.height <= 1080);
        return file ? file.link : null;
      }).filter(Boolean);
    }
    return res.data.photos.map(p => p.src.large2x);
  } catch (e) { return []; }
}

async function searchPixabay(query, type = 'photos') {
  if (!config.PIXABAY_API_KEY) return [];
  const url = `https://pixabay.com/api/${type === 'videos' ? 'videos/' : ''}`;
  try {
    const res = await axios.get(url, {
      params: { key: config.PIXABAY_API_KEY, q: query, per_page: 5, orientation: 'horizontal' }
    });
    if (type === 'videos') {
      return res.data.hits.map(h => h.videos.large ? h.videos.large.url : h.videos.medium.url);
    }
    return res.data.hits.map(h => h.largeImageURL);
  } catch (e) { return []; }
}



async function downloadFile(url, ext) {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const filePath = path.join(config.MEDIA_CACHE_DIR, `${hash}${ext}`);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 5000) return filePath;

  try {
    const res = await axios({ url, method: 'GET', responseType: 'stream', ...AXIOS_CONFIG });
    const writer = fs.createWriteStream(filePath);
    res.data.pipe(writer);
    return new Promise((resolve) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', () => resolve(null));
    });
  } catch (e) { return null; }
}

async function fetchMediaForSegment(seg, preferVideo = true) {
  const query = seg.keywords + " inspirational";
  console.log(`   [${seg.index + 1}] Searching media for: '${query}'`);

  if (preferVideo) {
    const videoUrls = [...(await searchPexels(query, 'videos')), ...(await searchPixabay(query, 'videos'))];
    for (let url of videoUrls) {
      const path = await downloadFile(url, '.mp4');
      if (path) {
        seg.mediaPath = path;
        seg.mediaType = 'video';
        return seg;
      }
    }
  }

  const photoUrls = [
    ...(await searchPexels(query, 'photos')),
    ...(await searchPixabay(query, 'photos'))
  ];

  for (let url of photoUrls) {
    const path = await downloadFile(url, '.jpg');
    if (path) {
      seg.mediaPath = path;
      seg.mediaType = 'image';
      return seg;
    }
  }

  seg.mediaPath = config.FALLBACK_IMAGE;
  seg.mediaType = 'image';
  return seg;
}

async function fetchAllMedia(segments, concurrency = 10) {
  console.log(`\n🖼️  Fetching media assets (concurrency=${concurrency})...`);
  
  for (let i = 0; i < segments.length; i += concurrency) {
    const batch = segments.slice(i, i + concurrency);
    await Promise.all(batch.map(seg => fetchMediaForSegment(seg)));
  }
  
  return segments;
}

module.exports = { fetchAllMedia };
