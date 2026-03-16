import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';

// We use dynamic imports for these to avoid CommonJS/ESM compatibility issues at boot
let pipeline: any;
let env: any;
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

      // Build base where clause
      const baseFilters: Prisma.Sql[] = [
        Prisma.sql`language = ${language}`
      ];

      // Relaxed crop filter: Match specific crop OR 'general'
      if (crop) {
        baseFilters.push(Prisma.sql`(LOWER(crop) = LOWER(${crop}) OR LOWER(crop) = 'general')`);
      }
      if (state) {
        baseFilters.push(Prisma.sql`(LOWER(state) = LOWER(${state}) OR LOWER(state) = 'pan-india')`);
      }

      // Tiered Search Strategy
      // Tier 1: Strict websearch (requires most words)
      let results: any[] = await this.prisma.$queryRaw`
        SELECT id, title, content, crop, state, ts_rank(fts_doc, websearch_to_tsquery('english', ${question})) as rank
        FROM agri_docs
        WHERE ${Prisma.join([...baseFilters, Prisma.sql`fts_doc @@ websearch_to_tsquery('english', ${question})`], ' AND ')}
        ORDER BY rank DESC
        LIMIT ${k}`;

      // Tier 2: Fallback to plainto_tsquery if Tier 1 is too strict
      if (!results.length) {
        results = await this.prisma.$queryRaw`
          SELECT id, title, content, crop, state, ts_rank(fts_doc, plainto_tsquery('english', ${question})) as rank
          FROM agri_docs
          WHERE ${Prisma.join([...baseFilters, Prisma.sql`fts_doc @@ plainto_tsquery('english', ${question})`], ' AND ')}
          ORDER BY rank DESC
          LIMIT ${k}`;
      }

      // Tier 3: If still no results, try WITHOUT crop/state filters as a last resort for knowledge
      if (!results.length) {
        results = await this.prisma.$queryRaw`
          SELECT id, title, content, crop, state, ts_rank(fts_doc, plainto_tsquery('english', ${question})) as rank
          FROM agri_docs
          WHERE fts_doc @@ plainto_tsquery('english', ${question})
          AND language = ${language}
          ORDER BY rank DESC
          LIMIT ${k}`;
      }

      // Threshold check: Even broad search must have some relevance
      if (!results.length || (results[0].rank < 0.01)) {
        return {
          answer: "I couldn't find a high-confidence match for your specific query in our grounded records. However, I am still monitoring local agricultural advisory databases. Please consult your local KVK for critical issues.",
          confidence: 0,
          sources: [],
          fallbackUsed: true,
          datasetCoverage: await this.getDatasetCoverage()
        };
      }

      const topMatch = results[0];
      const answer = `Based on agricultural records (${topMatch.crop}): ${topMatch.content.slice(0, 600)}${topMatch.content.length > 600 ? '...' : ''}`;

      return {
        answer: answer.trim(),
        confidence: Math.min(topMatch.rank * 10, 1.0),
        sources: results.map(r => ({
          title: r.title || 'Agri Document',
          snippet: r.content.slice(0, 200) + '...',
          crop: r.crop,
          state: r.state
        })),
        filtersUsed: { crop, state, language },
        fallbackUsed: false
      };
    } catch (err) {
      this.logger.error(`Retrieval Error: ${err.message}`);
      return {
        answer: "The advisory system is currently processing your request. Please try again shortly.",
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
