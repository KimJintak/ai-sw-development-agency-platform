import { NestFactory, Reflector } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/http-exception.filter'
import { RolesGuard } from './common/guards/roles.guard'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')

  app.enableCors({
    origin: [
      process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
      process.env.PORTAL_NEXTAUTH_URL ?? 'http://localhost:3001',
    ],
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  )

  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter())

  const reflector = app.get(Reflector)
  app.useGlobalGuards(new RolesGuard(reflector))

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Agency Platform API')
    .setDescription('REST API for the AI-Powered Software Development Agency Platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig))

  const port = process.env.API_PORT ?? 4000
  await app.listen(port)
  console.log(`API running on http://localhost:${port}`)
  console.log(`Swagger docs: http://localhost:${port}/api/docs`)
}

bootstrap()
