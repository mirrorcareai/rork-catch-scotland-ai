import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const SOURCE_URL = 'https://www.mediafire.com/file/rhf3u3dk4rpiizy/notification_sound.wav/file';
const DEST_PATH = '/Users/expo/workingdir/build/local/assets/notification_sound.wav';

async function run() {
  try {
    console.log('Starting download from', SOURCE_URL);
    const response = await fetch(SOURCE_URL);
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }
    const data = await response.arrayBuffer();
    await mkdir(dirname(DEST_PATH), { recursive: true });
    await writeFile(DEST_PATH, Buffer.from(data));
    console.log('Saved file to', DEST_PATH);
  } catch (error) {
    console.error('Failed to download notification sound', error);
    process.exitCode = 1;
  }
}

run();
