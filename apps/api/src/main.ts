import 'dotenv/config';
import { NestFactory, HttpAdapterHost, Reflector } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers (CSP, HSTS)
  app.use(helmet());

  // Enable URI-based versioning globally
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Cookie Parser for HTTP-Only Auth
  app.use(cookieParser());

  // Global Validation Pipe (prevent mass assignment)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global Serializer
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Global Exception Filter
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('KRISHI-EYE API')
    .setDescription('The core API documentation for KRISHI-EYE farmer platform.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // CORS config
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = isProduction
    ? [
        'https://krishieye.app', 
        'https://app.krishieye.app', 
        'https://krishieye.vercel.app',
        /\.vercel\.app$/, // Allow all Vercel previews
        /\.onrender\.com$/ // Allow Render services
      ]
    : [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'http://localhost:8081', 
        'https://staging.krishieye.app'
      ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API is running on: http://0.0.0.0:${port}/api/docs`);
}
bootstrap().catch(err => {
  console.error('CRITICAL: Application failed to bootstrap!');
  console.error(err);
  process.exit(1);
});
