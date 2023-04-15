import { fileURLToPath } from 'node:url';

const FILE_NAME = fileURLToPath(import.meta.url);

export const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url));

export const SERVER_PORT = 8000;
