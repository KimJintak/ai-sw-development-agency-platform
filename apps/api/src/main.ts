import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')

  app.enableCors({
    origin: true,
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  )

  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter())

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
