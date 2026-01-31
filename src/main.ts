import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Cookie parser for refresh token
  app.use(cookieParser());

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Enterprise RAG Platform API')
    .setDescription(
      `A comprehensive enterprise-grade REST API for managing documents, knowledge base, and AI-powered chat interactions using Retrieval-Augmented Generation (RAG).

## Features
- **Document Management**: Upload, store, and manage enterprise documents with fine-grained access control
- **Knowledge Base Integration**: Seamless integration with RAG service for document ingestion and intelligent querying
- **AI Chat Interface**: Real-time chat functionality with automatic RAG-powered responses based on user context
- **Access Control**: Role-based (RBAC) and department-based access rules for documents
- **File Storage**: AWS S3 integration with presigned URLs for scalable file storage

## Authentication
This API uses JWT-based authentication with refresh tokens:
1. **Access Token**: Short-lived token (default: 15 minutes) sent in the Authorization header
2. **Refresh Token**: Long-lived token (default: 7 days) stored as HTTP-only cookie

To authenticate:
1. Login via \`POST /api/auth/login\` to receive access and refresh tokens
2. Include the access token in the Authorization header: \`Bearer <access-token>\`
3. Use the refresh token cookie for token renewal via \`POST /api/auth/refresh\`

## Base URL
All endpoints are prefixed with \`/api\`

## Response Format
All responses follow a consistent structure:
- **Success**: \`{ status: "success", message?: string, data: any }\`
- **Error**: \`{ status: "error", message: string, errors?: any[] }\`

## Rate Limiting
API requests are subject to rate limiting. Check response headers for rate limit information.

## Support
For issues and questions, please contact the development team or refer to the project README.`,
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:3000', 'Development Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description:
          'Enter your JWT access token. Token is obtained from the login endpoint and expires after 15 minutes (default). Format: Bearer <token>',
        in: 'header',
      },
      'access-token',
    )
    .addCookieAuth('refresh_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refresh_token',
      description:
        'HTTP-only cookie containing the refresh token. Used for obtaining new access tokens when the current one expires. Token expires after 7 days (default).',
    })
    .addTag('Auth', 'Authentication and authorization endpoints. Handles user login, registration, token refresh, and logout.')
    .addTag('Health', 'Health check and system status endpoints.')
    .addTag('Users', 'User management endpoints. Create, read, update, and delete user accounts. Admin only.')
    .addTag('Documents', 'Document management endpoints. Upload, view, and manage enterprise documents with access control.')
    .addTag('Uploads', 'File upload endpoints. Direct upload and presigned URL generation for AWS S3 storage.')
    .addTag('Chats', 'Chat session management endpoints. Create, list, and manage chat conversations.')
    .addTag('Messages', 'Message endpoints. Send messages and receive RAG-powered responses from the knowledge base.')
    .addTag('Roles', 'Role management endpoints. Manage system roles and their permissions. Admin only.')
    .addTag('Permissions', 'Permission management endpoints. Define and manage system permissions. Admin only.')
    .addTag('Departments', 'Department management endpoints. Manage organizational departments. Admin only.')
    .addTag('Positions', 'Position management endpoints. Manage job positions and hierarchy levels. Admin only.')
    .addTag('User Profiles', 'User profile management endpoints. Manage extended user information including department and position assignments.')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}
bootstrap();
