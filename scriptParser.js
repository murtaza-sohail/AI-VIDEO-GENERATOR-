/**
 * scriptParser.js - Parses script and extracts keywords
 */

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "not", "no", "nor",
  "so", "yet", "both", "either", "neither", "as", "if", "then", "than",
  "that", "this", "these", "those", "it", "its", "you", "your", "we",
  "our", "they", "their", "he", "his", "she", "her", "i", "my", "me",
  "us", "him", "who", "what", "which", "when", "where", "how", "all",
  "each", "every", "more", "most", "very", "just", "also", "up", "out",
  "about", "into", "over", "after", "while", "through", "during"
]);

/**
 * Robustly cleans a line from the script.
 * Returns null if the line should be ignored entirely (headers, notes, timestamps).
 */
function cleanLine(line) {
  let cleaned = line.trim();
  if (!cleaned) return null;

  // 1. Ignore lines that are ENTIRELY storyboard notes: [Note] or (Note)
  if (/^\[.*?\]$/.test(cleaned) || /^\(.*?\)$/.test(cleaned)) return null;

  // 2. Ignore lines that look like Section Headers or Timestamps
  // Examples: "SECTION 1: ...", "INTRO CARD — 0:00", "0:08 to 1:00", "CLOSE — 12:00"
  if (/^(SECTION|INTRO|HOOK|OUTRO|CLOSE|TITLE|PART)\s*\d*[:\-\—\s]/i.test(cleaned)) return null;
  if (/^\d+:\d+\s+to\s+\d+:\d+/i.test(cleaned)) return null;
  if (/^\d+:\d+.*$/.test(cleaned)) return null;

  // 3. Remove mid-line storyboard notes: "Text [Note] more text" -> "Text more text"
  cleaned = cleaned.replace(/\[.*?\]/g, '');
  cleaned = cleaned.replace(/\(.*?\)/g, '');

  // 4. Remove dialogue prefixes: "Speaker:" or "Voiceover:" or "Text on screen:"
  cleaned = cleaned.replace(/^(voiceover|speaker|narrator|text on screen|you|me|person):\s*/i, '');

  // 5. Cleanup quotes and special chars
  cleaned = cleaned.replace(/^[\"\“\']|[\"\”\']$/g, ''); // Remove outer quotes
  cleaned = cleaned.replace(/\*+/g, ''); // Remove markdown bold/italics
  
  cleaned = cleaned.trim();
  
  // Final check: if it's just "Thank you." or "Stay with me." it's fine,
  // but if it's just a single word that looks like a label, ignore it.
  if (cleaned.length < 3) return null;

  return cleaned;
}

function extractKeywords(line, maxKeywords = 5) {
  const words = line.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));
  
  let candidates = words.length > 0 ? words : line.split(/\s+/).filter(w => w.length > 2);
  let query = candidates.slice(0, maxKeywords).join(' ');
  
  return query.trim() || "motivation success";
}

function parseScript(scriptText) {
  const lines = scriptText.split(/\r?\n/);
  const segments = [];
  let currentText = "";
  
  lines.forEach((line) => {
    const text = cleanLine(line);
    if (!text) return;
    
    // Group lines to avoid too many tiny segments
    // We aim for segments between 80 and 200 characters for good pacing
    if (currentText && (currentText.length + text.length < 180)) {
      currentText += " " + text;
    } else {
      if (currentText) {
        segments.push({
          text: currentText,
          keywords: extractKeywords(currentText),
          index: segments.length
        });
      }
      currentText = text;
    }
  });

  if (currentText) {
    segments.push({
      text: currentText,
      keywords: extractKeywords(currentText),
      index: segments.length
    });
  }
  
  return segments;
}

module.exports = { parseScript };
