#!/usr/bin/env node
// Fetches a YouTube video transcript and saves it as markdown
// Usage: fetch-youtube-transcript <youtube-url> [--output filename.md]
// Example: fetch-youtube-transcript https://youtu.be/uzkc-qNVoOk
//
// Requires: playwright (npx playwright install chromium)
// On first run: browser opens YouTube login page. Log in manually in the browser.
// The script detects login automatically. Session is saved to ~/.yt-session/ so you only need to log in once.

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import os from 'os';
import { makeConfig } from 'lino-arguments';
import { launchBrowser, makeBrowserCommander } from 'browser-commander';
import { normalizeYoutubeUrl, buildMarkdownTranscript } from './index.js';

const SESSION_DIR = join(os.homedir(), '.yt-session');
const AVATAR_SELECTOR = 'button#avatar-btn, img.yt-spec-avatar-shape__avatar';
const LOGIN_POLL_INTERVAL = 2000;
const LOGIN_MAX_WAIT = 300000;
const LOGIN_PROGRESS_INTERVAL = 10000;
const TRANSCRIPT_MAX_WAIT = 30000;
const TRANSCRIPT_POLL_INTERVAL = 1000;
const TRANSCRIPT_PROGRESS_INTERVAL = 5000;

const config = makeConfig({
  yargs: ({ yargs }) =>
    yargs
      .usage('Usage: $0 <youtube-url> [options]')
      .positional('url', {
        describe: 'YouTube video URL',
        type: 'string',
      })
      .option('output', {
        alias: 'o',
        type: 'string',
        describe: 'Output markdown file name',
      })
      .option('verbose', {
        alias: 'v',
        type: 'boolean',
        default: false,
        describe: 'Enable verbose logging',
      })
      .demandCommand(0),
});

const url =
  config._?.[0] ?? process.argv.slice(2).find((a) => !a.startsWith('-'));

if (!url) {
  console.error(
    'Usage: fetch-youtube-transcript <youtube-url> [--output filename.md]'
  );
  process.exit(1);
}

const { videoUrl, videoId } = normalizeYoutubeUrl(url);
const outputFile = config.output ?? `${videoId ?? 'transcript'}.md`;

async function pollForLogin(page) {
  let elapsed = 0;

  while (elapsed < LOGIN_MAX_WAIT) {
    await page.waitForTimeout(LOGIN_POLL_INTERVAL);
    elapsed += LOGIN_POLL_INTERVAL;

    const pageUrl = page.url();
    if (pageUrl.includes('youtube.com')) {
      const loggedIn = await page
        .locator(AVATAR_SELECTOR)
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (loggedIn) {
        console.log('Login successful!');
        return;
      }
    }

    if (elapsed % LOGIN_PROGRESS_INTERVAL === 0) {
      console.log(`  Still waiting for login... (${elapsed / 1000}s)`);
    }
  }

  console.log('WARNING: Login timeout (5 min). Proceeding anyway...');
}

async function ensureLoggedIn(page) {
  await page.goto('https://www.youtube.com', { waitUntil: 'networkidle' });

  const isLoggedIn = await page
    .locator(AVATAR_SELECTOR)
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (isLoggedIn) {
    console.log('Already logged in to YouTube.');
    return;
  }

  console.log('\n========================================');
  console.log('  YouTube login required.');
  console.log('  Please log in to your Google account');
  console.log('  in the browser window.');
  console.log('  Waiting for login automatically...');
  console.log('========================================\n');

  await page.goto(
    'https://accounts.google.com/ServiceLogin?service=youtube&continue=https://www.youtube.com',
    { waitUntil: 'domcontentloaded' }
  );

  await pollForLogin(page);
}

async function getVideoTitle(page) {
  try {
    const pageTitle = await page.evaluate(() => {
      const el = document.querySelector(
        'h1.ytd-watch-metadata yt-formatted-string, h1 yt-formatted-string, #title h1'
      );
      return el ? el.textContent.trim() : '';
    });
    if (!pageTitle) {
      throw new Error('empty');
    }
    console.log(`Title: ${pageTitle}`);
    return pageTitle;
  } catch {
    console.log('Could not get title.');
    return '';
  }
}

async function getVideoDuration(page) {
  try {
    const dur = page.locator('.ytp-time-duration');
    if (await dur.isVisible({ timeout: 3000 })) {
      const duration = await dur.textContent();
      console.log(`Duration: ${duration}`);
      return duration;
    }
  } catch {
    // ignore — duration is optional
  }
  return '';
}

async function expandDescription(page) {
  console.log('Step 1: Expand description...');
  try {
    const moreBtn = page.getByRole('button', { name: '...more' });
    await moreBtn.waitFor({ state: 'visible', timeout: 5000 });
    await moreBtn.click();
    await page.waitForTimeout(2000);
    console.log('Expanded.');
  } catch {
    console.log('No "...more" button (no description). Skipping.');
  }
}

async function clickShowTranscript(page) {
  console.log('Step 2: Show transcript...');
  try {
    const btn = page.getByRole('button', { name: 'Show transcript' });
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
    console.log('Clicked. Waiting for segments...');
    return true;
  } catch (e) {
    console.error(
      'ERROR: Could not find "Show transcript" button:',
      e.message.split('\n')[0]
    );
    return false;
  }
}

async function waitForTranscriptSegments(page) {
  let elapsed = 0;
  let segCount = 0;

  while (elapsed < TRANSCRIPT_MAX_WAIT) {
    segCount = await page.evaluate(
      () => document.querySelectorAll('transcript-segment-view-model').length
    );
    if (segCount > 0) {
      break;
    }
    await page.waitForTimeout(TRANSCRIPT_POLL_INTERVAL);
    elapsed += TRANSCRIPT_POLL_INTERVAL;
    if (elapsed % TRANSCRIPT_PROGRESS_INTERVAL === 0) {
      console.log(`Still waiting... (${elapsed / 1000}s)`);
    }
  }

  return segCount;
}

async function saveDebugInfo(page) {
  const debugDir = join(process.cwd(), 'debug');
  mkdirSync(debugDir, { recursive: true });
  await page.screenshot({
    path: join(debugDir, 'screenshot.png'),
    fullPage: true,
  });
  const html = await page.content();
  writeFileSync(join(debugDir, 'page.html'), html, 'utf-8');
  console.log(`Debug saved to ${debugDir}`);
}

function extractSegments(page) {
  return page.evaluate(() => {
    const segs = document.querySelectorAll('transcript-segment-view-model');
    return Array.from(segs)
      .map((seg) => {
        const timeEl = seg.querySelector(
          '.ytwTranscriptSegmentViewModelTimestamp'
        );
        const textEl = seg.querySelector('span[role="text"]');
        return {
          time: timeEl ? timeEl.textContent.trim() : '',
          text: textEl ? textEl.textContent.trim() : '',
        };
      })
      .filter((s) => s.time && s.text);
  });
}

async function fetchTranscript(page) {
  console.log(`\nFetching transcript: ${videoUrl}`);

  await page.goto(`${videoUrl}&hl=en`, { waitUntil: 'networkidle' });
  console.log('Page loaded.');

  const pageTitle = await getVideoTitle(page);
  const duration = await getVideoDuration(page);

  await expandDescription(page);

  const transcriptVisible = await clickShowTranscript(page);
  if (!transcriptVisible) {
    return null;
  }

  const segCount = await waitForTranscriptSegments(page);

  if (segCount === 0) {
    console.log('No segments found. Dumping debug info...');
    await saveDebugInfo(page);
    return null;
  }

  console.log(`${segCount} segments loaded.`);
  await page.waitForTimeout(1000);

  const segments = await extractSegments(page);
  console.log(`Extracted ${segments.length} segments.`);

  if (segments.length === 0) {
    return null;
  }

  return buildMarkdownTranscript({ pageTitle, videoUrl, duration, segments });
}

console.log('Launching browser...');

const { browser, page } = await launchBrowser({
  engine: 'playwright',
  userDataDir: SESSION_DIR,
  headless: false,
  verbose: config.verbose,
});

const commander = makeBrowserCommander({ page, verbose: config.verbose });

await ensureLoggedIn(page);

const md = await fetchTranscript(page);

if (md) {
  const filepath = join(process.cwd(), outputFile);
  writeFileSync(filepath, md, 'utf-8');
  console.log(`\nSAVED: ${filepath}`);
} else {
  console.log('\nFailed to extract transcript.');
}

await commander.destroy();
await browser.close();
console.log('Done.');
