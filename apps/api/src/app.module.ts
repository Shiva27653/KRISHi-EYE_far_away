import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FarmsModule } from './farms/farms.module';
import { FieldsModule } from './fields/fields.module';
import { TractorsModule } from './tractors/tractors.module';
import { JobsModule } from './jobs/jobs.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SupportModule } from './support/support.module';
import { AdminModule } from './admin/admin.module';
import { AiProxyModule } from './ai-proxy/ai-proxy.module';
import { DemoModule } from './demo/demo.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';
import { PrismaModule } from './database/prisma.module';
import { RagModule } from './rag/rag.module';
import { RolesGuard } from './common/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
    imports: [
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100, // 100 requests per minute
        }]),
        PrismaModule,
        AuthModule,
        UsersModule,
        FarmsModule,
        FieldsModule,
        TractorsModule,
        JobsModule,
        TelemetryModule,
        AnalyticsModule,
        SupportModule,
        AdminModule,
        AiProxyModule,
        DemoModule,
        HealthModule,
        AuditModule,
        RagModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
        { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    ],
})
export class AppModule { }
