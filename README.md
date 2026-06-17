# 🎬 AI YouTube Video Generator (Node.js)

Automatically generates a **13-minute motivational YouTube video** from a plain-text English script.

---

## ✨ Features

- 🎙️ **Natural Voiceover**: Microsoft Edge TTS via `node-edge-tts`.
- 🖼️ **Auto Media**: Stock images/videos from Pexels, Pixabay, Unsplash.
- ⏱️ **13-min Runtime**: Logic to auto-stretch clips to hit 13 minutes exactly.
- 🎵 **Background Music**: Low-volume ambient music overlay.
- 🎞️ **Parallel Processing**: Fast media fetching and audio generation.

---

## 🚀 Quick Start

### 1. Installation

```bash
cd "AI VIDEO GENERATOR"
npm install
```

### 2. Configuration

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Get keys:
- **Pexels**: https://www.pexels.com/api/
- **Pixabay**: https://pixabay.com/api/docs/

### 3. Usage

```bash
# Run with default sample script
node index.js
```

---

## 📁 Structure

- `index.js`: Main logic
- `config.js`: Configuration
- `audioEngine.js`: TTS / Music
- `mediaFetcher.js`: Image/Video retrieval
- `videoAssembler.js`: Ffmpeg stitcher
- `scriptParser.js`: Keyword extraction
