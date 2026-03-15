import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as fs from 'fs';

// We use dynamic imports for these to avoid CommonJS/ESM compatibility issues at boot
let pipeline: any;
let env: any;
let ollama: any;
const csv = require('csv-parser');

@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);
  private embedder: any;
  private isInitializing = false;
  private initializationError: string | null = null;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Non-blocking initialization to prevent startup timeouts on Render
    this.initEmbedder().catch(err => {
      this.logger.error(`Failed to initialize RAG embedder: ${err.message}`);
      this.initializationError = err.message;
    });
  }

  async initEmbedder() {
    if (this.isInitializing || this.embedder) return;
    this.isInitializing = true;
    
    try {
      this.logger.log('🏗️ Loading RAG dependencies and models...');
      
      // Dynamic imports for ESM compatibility
      const transformers = await import('@xenova/transformers');
      pipeline = transformers.pipeline;
      env = transformers.env;
      
      const ollamaModule = await import('ollama');
      ollama = ollamaModule.default || ollamaModule;

      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      
      // This may take a while on Render (downloads ~80MB)
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.logger.log('✅ RAG Embedder ready');
      this.initializationError = null;
    } catch (err) {
      this.initializationError = err.message;
      this.logger.error(`RAG Initialization Error: ${err.message}`);
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  async embed(text: string): Promise<number[]> {
    if (!this.embedder) {
      await this.initEmbedder();
    }
    
    const output = await this.embedder(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data);
  }

  async ingestCsv(filePath: string, cropPrefix = '') {
    if (!fs.existsSync(filePath)) {
      this.logger.warn(`Dataset file not found: ${filePath}. Skipping ingestion.`);
      return 0;
    }

    const docs: any[] = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: any) => {
          const question = row.Question || row.question;
          const answer = row.Answer || row.answer;
          const crop = row.Crop || row.crop || cropPrefix || 'general';
          const state = row.State || row.state || 'pan-india';

          if (question && answer) {
            const content = `${question}\n\n${answer}`.trim();
            if (content.length > 50) {
              docs.push({
                content,
                crop: crop.toLowerCase(),
                state: state.toLowerCase()
              });
            }
          }
        })
        .on('end', async () => {
          this.logger.log(`📥 Ingesting ${docs.length} docs from ${filePath}...`);
          
          const batchSize = 25; // Smaller batch for stability
          for (let i = 0; i < docs.length; i += batchSize) {
            const batch = docs.slice(i, i + batchSize);
            await Promise.all(batch.map(async (doc) => {
              try {
                const vector = await this.embed(doc.content);
                const vectorStr = `[${vector.join(',')}]`;
                
                await this.prisma.$executeRawUnsafe(
                  `INSERT INTO agri_docs (id, content, crop, state, embedding) 
                   VALUES ($1, $2, $3, $4, $5::vector)
                   ON CONFLICT DO NOTHING`, // Safer for seeding
                  require('crypto').randomUUID(),
                  doc.content,
                  doc.crop,
                  doc.state,
                  vectorStr
                );
              } catch (e) {
                // Silently skip if one doc fails
              }
            }));
            if (i % 100 === 0) this.logger.log(`✅ Progress: ${i}/${docs.length}`);
            if (i >= 300) break; // Aggressive limit for Render demo
          }
          resolve(docs.length);
        })
        .on('error', reject);
    });
  }

  async query(question: string, crop?: string, k = 3) {
    try {
      const queryVector = await this.embed(question);
      const vectorStr = `[${queryVector.join(',')}]`;
      
      const results: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id, content, crop, state, (embedding <=> $1::vector) as distance
         FROM agri_docs
         ${crop ? 'WHERE crop = $2' : ''}
         ORDER BY embedding <=> $1::vector
         LIMIT $3`,
        vectorStr,
        ...(crop ? [crop.toLowerCase()] : []),
        k
      );
      
      if (!results.length) {
        return { answer: "I couldn't find specific grounded data for this query in my current database.", sources: [] };
      }

      const context = results.map(d => d.content).join('\n\n');
      
      if (!ollama) {
        // One last attempt to load ollama
        const ollamaModule = await import('ollama');
        ollama = ollamaModule.default || ollamaModule;
      }

      const response = await ollama.chat({
        model: 'tinyllama',
        messages: [
          {
            role: 'system',
            content: `Use the following context to answer: ${context}`
          },
          { role: 'user', content: question }
        ]
      });
      
      return {
        answer: response.message.content,
        sources: results.map(d => ({ crop: d.crop, snippet: d.content.slice(0, 100) }))
      };
    } catch (err) {
      this.logger.error(`Query Error: ${err.message}`);
      return {
        answer: `Advisory search is currently warming up or Ollama is offline. Error: ${err.message}`,
        sources: []
      };
    }
  }
}
