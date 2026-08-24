import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.useStaticAssets(join(__dirname, '..', '..', 'front-end'), { prefix: '/front-end' });
  
  app.enableCors();
  
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

