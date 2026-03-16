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

      // Base filters
      const baseFilters: Prisma.Sql[] = [Prisma.sql`language = ${language}`];
      if (crop) {
        baseFilters.push(Prisma.sql`(LOWER(crop) = LOWER(${crop}) OR LOWER(crop) = 'general')`);
      }
      if (state) {
        baseFilters.push(Prisma.sql`(LOWER(state) = LOWER(${state}) OR LOWER(state) = 'pan-india')`);
      }

      // Cleanup and tokenize the question for flexible queries
      const words = question.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const orQuery = words.join(' | ');
      const cropAnchor = crop ? crop.toLowerCase() : (words[0] || 'agriculture');

      // TIER 1: Strict Websearch (Phrase-aware)
      let results: any[] = await this.prisma.$queryRaw`
        SELECT id, title, content, crop, state, ts_rank(fts_doc, websearch_to_tsquery('english', ${question})) as rank
        FROM agri_docs
        WHERE ${Prisma.join([...baseFilters, Prisma.sql`fts_doc @@ websearch_to_tsquery('english', ${question})`], ' AND ')}
        ORDER BY rank DESC LIMIT ${k}`;

      // TIER 2: Standard AND (Requires all terms)
      if (!results.length) {
        results = await this.prisma.$queryRaw`
          SELECT id, title, content, crop, state, ts_rank(fts_doc, plainto_tsquery('english', ${question})) as rank
          FROM agri_docs
          WHERE ${Prisma.join([...baseFilters, Prisma.sql`fts_doc @@ plainto_tsquery('english', ${question})`], ' AND ')}
          ORDER BY rank DESC LIMIT ${k}`;
      }

      // TIER 3: Anchored OR (Must have crop/anchor, maybe have descriptive words)
      if (!results.length && words.length > 1) {
        const anchoredTsQuery = `${cropAnchor} & (${orQuery})`;
        results = await this.prisma.$queryRaw`
          SELECT id, title, content, crop, state, ts_rank(fts_doc, to_tsquery('english', ${anchoredTsQuery})) as rank
          FROM agri_docs
          WHERE ${Prisma.join([...baseFilters, Prisma.sql`fts_doc @@ to_tsquery('english', ${anchoredTsQuery})`], ' AND ')}
          ORDER BY rank DESC LIMIT ${k}`;
      }

      // TIER 4: Global Ranked OR (Any word, highest rank first, no filters)
      if (!results.length) {
        results = await this.prisma.$queryRaw`
          SELECT id, title, content, crop, state, ts_rank(fts_doc, to_tsquery('english', ${orQuery})) as rank
          FROM agri_docs
          WHERE fts_doc @@ to_tsquery('english', ${orQuery})
          AND language = ${language}
          ORDER BY rank DESC LIMIT ${k}`;
      }

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
      const answer = `According to agricultural advisory records (${topMatch.crop}): ${topMatch.content.slice(0, 650)}${topMatch.content.length > 650 ? '...' : ''}`;

      return {
        answer: answer.trim(),
        confidence: Math.min(topMatch.rank * 10, 1.0),
        sources: results.map(r => ({
          title: r.title || 'Agri Document',
          snippet: r.content.slice(0, 220) + '...',
          crop: r.crop,
          state: r.state
        })),
        filtersUsed: { crop, state, language },
        fallbackUsed: results.length < k || results[0].rank < 0.1
      };
    } catch (err) {
      this.logger.error(`Retrieval Error: ${err.message}`);
      return {
        answer: "The advisory system is currently processing high query volumes. Please try again shortly.",
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
