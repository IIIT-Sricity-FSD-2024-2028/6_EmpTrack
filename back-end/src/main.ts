import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', '..', 'front-end'), { prefix: '/front-end' });

  app.enableCors();

  // Technical Member screenshot/log uploads are sent as base64 data URLs, which
  // overflow Express's 100kb default body limit. The per-file cap is enforced in
  // TechnicalMemberService; this just has to be comfortably above it.
  app.use(json({ limit: '12mb' }));
  app.use(urlencoded({ extended: true, limit: '12mb' }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true
  }));
  
  app.useGlobalFilters(new HttpExceptionFilter());
  
  const config = new DocumentBuilder()
    .setTitle('EmpTrack API')
    .setDescription('The EmpTrack API documentation for backend mock structure')
    .setVersion('1.0')
    .build();


const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);





  
  await app.listen(process.env.PORT ?? 3000);
console.log(`Server running on http://localhost:${process.env.PORT ?? 3000}`);
console.log(`Swagger available at http://localhost:${process.env.PORT ?? 3000}/api/docs`);

}
bootstrap();

