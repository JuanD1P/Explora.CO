import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// __dirname -> Backend/utils
// ROOT_DIR  -> Backend
export const ROOT_DIR    = path.resolve(__dirname, '..');
export const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(ROOT_DIR, 'uploads');       // -> Backend/uploads
