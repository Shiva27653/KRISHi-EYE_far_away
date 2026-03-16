import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RagService } from '../rag/rag.service';

@ApiTags('health')
@Controller('health')
export class HealthController {

  constructor(private ragService: RagService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  checkHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('advisor')
  @ApiOperation({ summary: 'Advisor-specific health check and stats' })
  async checkAdvisorHealth() {
    const stats = await this.ragService.getStats();
    return {
      status: Number(stats.totalDocuments) > 0 ? 'available' : 'degraded',
      stats
    };
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Readiness check for LB' })
  checkReadiness() {
    return { status: 'ready' };
  }
}
