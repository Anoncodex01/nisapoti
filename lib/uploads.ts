import { join } from 'path';

const defaultUploadsBaseDir = () => join(process.cwd(), 'public', 'uploads');

export const getUploadsBaseDir = () => {
  const configured = process.env.NISAPOTI_UPLOADS_DIR;
  if (configured && configured.trim().length > 0) {
    return configured;
  }
  return defaultUploadsBaseDir();
};

export const getUploadsDir = (...segments: string[]) =>
  join(getUploadsBaseDir(), ...segments);
