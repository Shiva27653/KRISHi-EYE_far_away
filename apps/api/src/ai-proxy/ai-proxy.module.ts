import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiProxyController } from './ai-proxy.controller';
import { AiProxyService } from './ai-proxy.service';
import { SupportModule } from '../support/support.module';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    forwardRef(() => SupportModule)
  ],
  controllers: [AiProxyController],
  providers: [AiProxyService],
})
export class AiProxyModule { }
