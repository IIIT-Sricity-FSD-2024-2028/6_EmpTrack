import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { createValidationPipe } from './common/validation/validators';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', '..', 'front-end'), { prefix: '/front-end' });

  // Security headers (CSP left to default-off since the app is served cross-origin from
  // a plain static front-end that isn't nonce-aware; the rest of Helmet's defaults -
  // HSTS, X-Frame-Options, X-Content-Type-Options, etc. - apply as-is).
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

  // Origins are configurable via CORS_ORIGIN (comma-separated) so production can lock
  // this down; unset keeps the previous wide-open behavior the existing frontend relies
  // on (it's fetched from a different origin/port than the API).
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true,
    credentials: true,
  });

  // Technical Member screenshot/log uploads are sent as base64 data URLs, which
  // overflow Express's 100kb default body limit. The per-file cap is enforced in
  // TechnicalMemberService; this just has to be comfortably above it.
  app.use(json({ limit: '12mb' }));
  app.use(urlencoded({ extended: true, limit: '12mb' }));

  // Strips undeclared fields and returns field-level errors - see createValidationPipe.
  app.useGlobalPipes(createValidationPipe());

  app.useGlobalFilters(app.get(HttpExceptionFilter));

  const config = new DocumentBuilder()
    .setTitle('EmpTrack API')
    .setDescription('The EmpTrack API documentation for backend mock structure')
    .setVersion('1.0')
    .addBearerAuth()
    .build();


const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);






  await app.listen(process.env.PORT ?? 3000);
console.log(`Server running on http://localhost:${process.env.PORT ?? 3000}`);
console.log(`Swagger available at http://localhost:${process.env.PORT ?? 3000}/api/docs`);

}
bootstrap();
