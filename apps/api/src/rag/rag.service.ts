import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { pipeline, env } from '@xenova/transformers';
import ollama from 'ollama';
import * as fs from 'fs';
const csv = require('csv-parser');

env.allowLocalModels = false;
env.allowRemoteModels = true;

@Injectable()
export class RagService implements OnModuleInit {
  private embedder: any;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.initEmbedder();
  }

  async initEmbedder() {
    console.log('🏗️ Initializing Sentence Transformers (Xenova/all-MiniLM-L6-v2)...');
    this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Embedder ready');
  }

  async embed(text: string): Promise<number[]> {
    if (!this.embedder) await this.initEmbedder();
    const output = await this.embedder(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data);
  }

  async ingestCsv(filePath: string, cropPrefix = '') {
    const docs: any[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: any) => {
          // Adjust based on KCC header: 'Question' and 'Answer'
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
          console.log(`📥 Ingesting ${docs.length} docs from ${filePath}...`);
          
          // Seed in batches to avoid overwhelming
          const batchSize = 50;
          for (let i = 0; i < docs.length; i += batchSize) {
            const batch = docs.slice(i, i + batchSize);
            await Promise.all(batch.map(async (doc) => {
              try {
                const vector = await this.embed(doc.content);
                // We use raw SQL for insertion because of Unsupported("vector(384)")
                const vectorStr = `[${vector.join(',')}]`;
                
                await this.prisma.$executeRawUnsafe(
                  `INSERT INTO agri_docs (id, content, crop, state, embedding) 
                   VALUES ($1, $2, $3, $4, $5::vector)
                   ON CONFLICT (id) DO UPDATE SET embedding = $5::vector`,
                  require('crypto').randomUUID(),
                  doc.content,
                  doc.crop,
                  doc.state,
                  vectorStr
                );
              } catch (e) {
                console.error('Ingestion error for doc:', e.message);
              }
            }));
            console.log(`✅ Progress: ${Math.min(i + batchSize, docs.length)}/${docs.length}`);
            if (i >= 500) break; // Limit for demo as per user request slice(0, 1000)
          }
          resolve(docs.length);
        })
        .on('error', (err: any) => {
          console.error('CSV Read Error:', err);
          reject(err);
        });
    });
  }

  async query(question: string, crop?: string, k = 5) {
    const queryVector = await this.embed(question);
    const vectorStr = `[${queryVector.join(',')}]`;
    
    // Raw SQL for vector similarity search
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
    
    const context = results.map(d => d.content).join('\n\n');
    
    try {
      const response = await ollama.chat({
        model: 'tinyllama',
        messages: [
          {
            role: 'system',
            content: `You are an Indian agriculture expert. Answer the following question based ONLY on the provided context. If the answer is not in the context, say you don't know based on available records. 
            
            Context:
            ${context}`
          },
          { role: 'user', content: question }
        ]
      });
      
      return {
        answer: response.message.content,
        sources: results.map(d => ({
          crop: d.crop,
          snippet: d.content.slice(0, 150) + '...'
        }))
      };
    } catch (e) {
      console.error('Ollama Error:', e);
      return {
        answer: "Failed to connect to local Ollama service. Please ensure 'ollama serve' is running and 'tinyllama' is pulled.",
        sources: results.map(d => ({ crop: d.crop, snippet: d.content.slice(0, 100) }))
      };
    }
  }
}
