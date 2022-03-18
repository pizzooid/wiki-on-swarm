import path from 'path';

export const cwd = process.cwd();
export const zDumpDir = path.join(cwd, 'dump','A');
export const frontendDir = path.join(cwd, 'zimbee-frontend');
export const indexDir = path.join(frontendDir,'public','index');
export const indexFile = path.join(indexDir,'pages');
