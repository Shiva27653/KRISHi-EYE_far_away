import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RagService } from './rag.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller({ path: 'rag', version: '1' })
export class RagController {
  constructor(private ragService: RagService) {}

  @Get('query')
  @ApiOperation({ summary: 'Query the grounded retrieval advisor' })
  async query(
    @Query('q') q: string,
    @Query('crop') crop?: string,
    @Query('state') state?: string,
    @Query('lang') lang?: string
  ) {
    if (!q) return { answer: 'Please provide a search query.' };
    return this.ragService.query(q, { crop, state, language: lang });
  }
}
