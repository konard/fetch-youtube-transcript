/**
 * Tests for fetch-youtube-transcript utilities
 * Works with Node.js, Bun, and Deno
 */

import { describe, it, expect } from 'test-anywhere';
import { normalizeYoutubeUrl, buildMarkdownTranscript } from '../src/index.js';

describe('normalizeYoutubeUrl', () => {
  it('should handle full youtube.com watch URLs', () => {
    const { videoUrl, videoId } = normalizeYoutubeUrl(
      'https://www.youtube.com/watch?v=uzkc-qNVoOk'
    );
    expect(videoId).toBe('uzkc-qNVoOk');
    expect(videoUrl).toBe('https://www.youtube.com/watch?v=uzkc-qNVoOk');
  });

  it('should normalize youtu.be short URLs to full watch URLs', () => {
    const { videoUrl, videoId } = normalizeYoutubeUrl(
      'https://youtu.be/uzkc-qNVoOk'
    );
    expect(videoId).toBe('uzkc-qNVoOk');
    expect(videoUrl).toBe('https://www.youtube.com/watch?v=uzkc-qNVoOk');
  });

  it('should extract videoId from full URLs', () => {
    const { videoId } = normalizeYoutubeUrl(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );
    expect(videoId).toBe('dQw4w9WgXcQ');
  });
});

describe('buildMarkdownTranscript', () => {
  it('should build basic markdown with title and segments', () => {
    const md = buildMarkdownTranscript({
      pageTitle: 'Test Video',
      videoUrl: 'https://www.youtube.com/watch?v=abc123',
      segments: [
        { time: '0:00', text: 'Hello world' },
        { time: '0:05', text: 'This is a test' },
      ],
    });

    expect(md).toContain('# Test Video (transcript)');
    expect(md).toContain('Source: [YouTube - Test Video]');
    expect(md).toContain('0:00 — Hello world');
    expect(md).toContain('0:05 — This is a test');
    expect(md).toContain('---');
  });

  it('should include duration when provided', () => {
    const md = buildMarkdownTranscript({
      pageTitle: 'Test Video',
      videoUrl: 'https://www.youtube.com/watch?v=abc123',
      duration: '10:30',
      segments: [{ time: '0:00', text: 'Hello' }],
    });

    expect(md).toContain('Duration: 10:30');
  });

  it('should omit duration when not provided', () => {
    const md = buildMarkdownTranscript({
      pageTitle: 'Test Video',
      videoUrl: 'https://www.youtube.com/watch?v=abc123',
      segments: [{ time: '0:00', text: 'Hello' }],
    });

    expect(md).not.toContain('Duration:');
  });

  it('should include the video URL in the source link', () => {
    const videoUrl = 'https://www.youtube.com/watch?v=abc123';
    const md = buildMarkdownTranscript({
      pageTitle: 'My Video',
      videoUrl,
      segments: [{ time: '0:00', text: 'Text' }],
    });

    expect(md).toContain(videoUrl);
  });
});
