import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Keep AppModule e2e suites isolated from the developer's persistent workflow DB. */
export function useIsolatedWorkflowDb(prefix: string) {
  let directory: string;
  let previous: string | undefined;
  let previousUploadDirectory: string | undefined;
  beforeAll(() => {
    directory = mkdtempSync(join(tmpdir(), prefix));
    previous = process.env.EMPTRACK_WORKFLOW_DB;
    previousUploadDirectory = process.env.UPLOAD_DIR;
    process.env.EMPTRACK_WORKFLOW_DB = join(directory, 'workflow.sqlite');
    process.env.UPLOAD_DIR = join(directory, 'uploads');
  });
  afterAll(() => {
    if (previous === undefined) delete process.env.EMPTRACK_WORKFLOW_DB;
    else process.env.EMPTRACK_WORKFLOW_DB = previous;
    if (previousUploadDirectory === undefined) delete process.env.UPLOAD_DIR;
    else process.env.UPLOAD_DIR = previousUploadDirectory;
    if (directory) rmSync(directory, { recursive: true, force: true });
  });
}
