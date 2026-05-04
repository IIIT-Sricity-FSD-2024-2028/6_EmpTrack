import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
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
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
