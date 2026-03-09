/**
 * fetch-youtube-transcript
 * Utility functions for fetching YouTube transcripts
 */

const YOUTUBE_HOSTNAME = 'youtu.be';
const YOUTUBE_WATCH_BASE = 'https://www.youtube.com/watch';

/**
 * Normalize a YouTube URL to a standard watch URL and extract the video ID.
 * Supports both full URLs (youtube.com/watch?v=...) and short URLs (youtu.be/...).
 *
 * @param {string} url - YouTube video URL
 * @returns {{ videoUrl: string, videoId: string|null }} Normalized URL and video ID
 */
export function normalizeYoutubeUrl(url) {
  const parsed = new URL(url);
  let videoId = parsed.searchParams.get('v');
  let videoUrl = url;

  if (parsed.hostname === YOUTUBE_HOSTNAME) {
    videoId = parsed.pathname.slice(1);
    videoUrl = `${YOUTUBE_WATCH_BASE}?v=${videoId}`;
  }

  return { videoUrl, videoId };
}

/**
 * Build a markdown transcript from a list of transcript segments.
 *
 * @param {Object} options - Options
 * @param {string} options.pageTitle - Video title
 * @param {string} options.videoUrl - Full YouTube URL
 * @param {string} [options.duration] - Video duration string
 * @param {Array<{time: string, text: string}>} options.segments - Transcript segments
 * @returns {string} Markdown formatted transcript
 */
export function buildMarkdownTranscript({
  pageTitle,
  videoUrl,
  duration,
  segments,
}) {
  let md = `# ${pageTitle} (transcript)\n\n`;
  md += `Source: [YouTube - ${pageTitle}](${videoUrl})\n`;
  if (duration) {
    md += `Duration: ${duration}\n`;
  }
  md += `\n---\n\n`;
  for (const seg of segments) {
    md += `${seg.time} — ${seg.text}\n\n`;
  }
  return md;
}
