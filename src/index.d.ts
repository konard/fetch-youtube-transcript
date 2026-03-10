/**
 * fetch-youtube-transcript type definitions
 */

/**
 * A transcript segment with timestamp and text
 */
export interface TranscriptSegment {
  time: string;
  text: string;
}

/**
 * Result of normalizeYoutubeUrl
 */
export interface NormalizedYoutubeUrl {
  videoUrl: string;
  videoId: string | null;
}

/**
 * Options for buildMarkdownTranscript
 */
export interface BuildMarkdownTranscriptOptions {
  pageTitle: string;
  videoUrl: string;
  duration?: string;
  segments: TranscriptSegment[];
}

/**
 * Normalize a YouTube URL to a standard watch URL and extract the video ID.
 * Supports both full URLs (youtube.com/watch?v=...) and short URLs (youtu.be/...).
 *
 * @param url - YouTube video URL
 * @returns Normalized URL and video ID
 */
export declare function normalizeYoutubeUrl(url: string): NormalizedYoutubeUrl;

/**
 * Build a markdown transcript from a list of transcript segments.
 *
 * @param options - Options
 * @returns Markdown formatted transcript
 */
export declare function buildMarkdownTranscript(
  options: BuildMarkdownTranscriptOptions
): string;
