import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {
  BLOCKED_EXTENSIONS,
  GLOBAL_MAX_FILE_SIZE_BYTES,
  UPLOAD_CATEGORIES,
  UploadCategory,
} from './upload.constants';
import { FileLoggerService } from '../common/logger/file-logger.service';
import { contentMatchesExtension } from '../common/utils/file-signature.util';

@Injectable()
export class UploadService {
  private readonly baseDir: string;

  constructor(private readonly logger: FileLoggerService) {
    this.baseDir = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
    for (const category of Object.keys(UPLOAD_CATEGORIES)) {
      fs.mkdirSync(path.join(this.baseDir, category), { recursive: true });
    }
  }

  categoryDir(category: UploadCategory): string {
    return path.join(this.baseDir, category);
  }

  // Validates the buffered upload against its category's rules and, only if everything
  // checks out, writes it to disk under a freshly generated name. The original filename
  // is used only to recover an extension - it is never used as, or turned into, a path.
  saveFile(
    category: UploadCategory,
    file: Express.Multer.File,
    actor: { emp_id?: string; role?: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file was provided.');
    }

    const rules = UPLOAD_CATEGORIES[category];
    const originalExt = path.extname(file.originalname || '').toLowerCase();

    if (BLOCKED_EXTENSIONS.includes(originalExt)) {
      this.logFailure(category, file, actor, 'Blocked (executable) extension rejected');
      throw new BadRequestException('This file type is not allowed.');
    }
    if (!rules.allowedExtensions.includes(originalExt)) {
      this.logFailure(category, file, actor, `Extension ${originalExt || '(none)'} not allowed for ${category}`);
      throw new BadRequestException(
        `Invalid file type. Allowed for ${rules.label}: ${rules.allowedExtensions.join(', ')}.`,
      );
    }
    if (!rules.allowedMimeTypes.includes(file.mimetype)) {
      this.logFailure(category, file, actor, `MIME type ${file.mimetype} not allowed for ${category}`);
      throw new BadRequestException(
        `Invalid file type. Allowed for ${rules.label}: ${rules.allowedMimeTypes.join(', ')}.`,
      );
    }
    if (file.size > rules.maxSizeBytes) {
      this.logFailure(category, file, actor, `File exceeds ${rules.maxSizeBytes} bytes for ${category}`);
      throw new BadRequestException(
        `File too large. Maximum size for ${rules.label} is ${Math.floor(rules.maxSizeBytes / (1024 * 1024))}MB.`,
      );
    }
    if (!file.buffer || file.buffer.length === 0) {
      this.logFailure(category, file, actor, 'Empty or corrupted file buffer');
      throw new BadRequestException('The uploaded file is empty or corrupted.');
    }
    // The MIME type and name above are browser-supplied; the bytes must agree.
    if (!contentMatchesExtension(file.buffer, originalExt)) {
      this.logFailure(category, file, actor, `Content does not match ${originalExt}`);
      throw new BadRequestException(`The file contents do not match its ${originalExt} extension.`);
    }

    const storedName = `${randomUUID()}${originalExt}`;
    const destination = path.join(this.categoryDir(category), storedName);

    try {
      fs.writeFileSync(destination, file.buffer);
    } catch (err: any) {
      this.logger.error('Upload storage failure', {
        category,
        actorId: actor.emp_id,
        error: err?.message,
      });
      throw new BadRequestException('Could not store the uploaded file. Please try again.');
    }

    this.logger.info('File uploaded successfully', {
      category,
      storedName,
      originalName: file.originalname,
      sizeBytes: file.size,
      actorId: actor.emp_id,
      role: actor.role,
    });

    return {
      success: true,
      category,
      fileId: storedName,
      originalName: file.originalname,
      sizeBytes: file.size,
      mimeType: file.mimetype,
      // A safe, app-relative URL - never a filesystem path - the client can use to
      // fetch the file back through the download endpoint below.
      url: `/uploads/${category}/${storedName}`,
    };
  }

  private logFailure(category: string, file: Express.Multer.File, actor: any, reason: string) {
    this.logger.warn('File upload rejected', {
      category,
      reason,
      originalName: file?.originalname,
      mimeType: file?.mimetype,
      sizeBytes: file?.size,
      actorId: actor?.emp_id,
      role: actor?.role,
    });
  }

  resolveSafeFilePath(category: UploadCategory, filename: string): string {
    return path.join(this.categoryDir(category), filename);
  }
}

// Re-exported so main.ts / other modules can reference the same ceiling used to
// configure Multer's own limits.
export { GLOBAL_MAX_FILE_SIZE_BYTES };
