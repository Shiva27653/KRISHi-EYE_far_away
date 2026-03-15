import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { RagService } from './rag.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('v1/rag')
export class RagController {
  constructor(private ragService: RagService) {}

  @Post('ingest')
  async ingest(@Body() { file, crop }: { file: string, crop?: string }) {
    const count = await this.ragService.ingestCsv(file, crop);
    return { status: 'success', ingested: count };
  }

  @Get('query')
  async query(
    @Query('q') q: string,
    @Query('crop') crop?: string
  ) {
    if (!q) return { answer: 'Please provide a question.' };
    return this.ragService.query(q, crop);
  }
}
