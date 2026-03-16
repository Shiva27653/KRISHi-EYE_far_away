import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';

// We use dynamic imports for these to avoid CommonJS/ESM compatibility issues at boot
let pipeline: any;
let env: any;
let ollama: any;
const csv = require('csv-parser');

@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('🚀 Retrieval Advisor active (Mode: Deterministic FTS)');
  }

  async query(question: string, context?: { crop?: string; state?: string; language?: string }, k = 3) {
    try {
      const { crop, state, language = 'en' } = context || {};

      // Tiered Retrieval Strategy:
      // 1. Metadata filtering (Strict)
      // 2. PostgreSQL Full-Text Search (Phrase and keyword matching)
      // 3. deterministic ranking

      // Build dynamic where clauses safely
      const whereClauses: Prisma.Sql[] = [
        Prisma.sql`fts_doc @@ websearch_to_tsquery('english', ${question})`
      ];

      if (crop) {
        whereClauses.push(Prisma.sql`LOWER(crop) = LOWER(${crop})`);
      }
      if (state) {
        whereClauses.push(Prisma.sql`LOWER(state) = LOWER(${state})`);
      }
      
      whereClauses.push(Prisma.sql`language = ${language}`);

      const results: any[] = await this.prisma.$queryRaw`
        SELECT id, title, content, crop, state, ts_rank(fts_doc, websearch_to_tsquery('english', ${question})) as rank
        FROM agri_docs
        WHERE ${Prisma.join(whereClauses, ' AND ')}
        ORDER BY rank DESC
        LIMIT ${k}`;

      if (!results.length || (results[0].rank < 0.05)) {
        return {
          answer: "No highly relevant grounded agricultural data found for your specific query in our verified datasets. Please consult your local Krishi Vigyan Kendra (KVK) or a certified agronomist for critical issues.",
          confidence: 0,
          sources: [],
          fallbackUsed: true,
          datasetCoverage: await this.getDatasetCoverage()
        };
      }

      // Deterministic Synthesis: 
      // Instead of an LLM, we combine the top snippets into a structured response.
      const topMatch = results[0];
      const answer = `Based on records from ${topMatch.crop || 'agricultural'} datasets: ${topMatch.content.slice(0, 500)}${topMatch.content.length > 500 ? '...' : ''}`;

      return {
        answer: answer.trim(),
        confidence: Math.min(topMatch.rank * 10, 1.0), // Simple scaling for UI
        sources: results.map(r => ({
          title: r.title || 'Agri Document',
          snippet: r.content.slice(0, 160) + '...',
          crop: r.crop,
          state: r.state
        })),
        filtersUsed: { crop, state, language },
        fallbackUsed: false
      };
    } catch (err) {
      this.logger.error(`Retrieval Error: ${err.message}`);
      return {
        answer: "The advisory system is currently undergoing maintenance. Please try again later.",
        confidence: 0,
        sources: [],
        error: true
      };
    }
  }

  async getDatasetCoverage() {
    try {
      const stats: any[] = await this.prisma.$queryRaw`
        SELECT crop, count(*) as count 
        FROM agri_docs 
        GROUP BY crop 
        ORDER BY count DESC 
        LIMIT 10`;
      return stats.map(s => `${s.crop} (${s.count})`);
    } catch {
      return [];
    }
  }

  async getStats() {
    try {
      const count = await this.prisma.agriDoc.count();
      const datasets: any[] = await this.prisma.$queryRaw`
        SELECT source_dataset as name, count(*) as count 
        FROM agri_docs 
        GROUP BY source_dataset`;
      return {
        totalDocuments: count,
        datasets: datasets.map(d => ({ name: d.name, count: Number(d.count) }))
      };
    } catch (err) {
      return { totalDocuments: 0, datasets: [], error: err.message };
    }
  }
}
