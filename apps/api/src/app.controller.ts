import { Controller, Get, Version } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
@ApiTags('Root')
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @ApiOperation({ summary: 'Root API ping' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'V1 API ping' })
  getHelloV1(): string {
    return 'KRISHI-EYE API v1 Ready';
  }
}
