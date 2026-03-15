import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BatchTelemetryDto } from './dto/telemetry.dto';
import { TelemetryGateway } from './telemetry.gateway';
import { LiveTelemetryPayload } from '@farmer-platform/types';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private activeSimulators = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: TelemetryGateway,
  ) { }

  async ingest(dto: BatchTelemetryDto, userId: string): Promise<any> {
    const tractor = await this.prisma.tractor.findUnique({ where: { id: dto.tractorId } });
    if (!tractor) throw new NotFoundException('Tractor not found');

    const job = await this.prisma.operationJob.findUnique({ where: { id: dto.jobId } });
    if (!job) throw new NotFoundException('Job not found');

    if (job.tractorId !== dto.tractorId) {
      throw new BadRequestException('The specified tractor is not assigned to this job');
    }

    const member = await this.prisma.farmMember.findFirst({
      where: { farmId: tractor.farmId, userId: userId }
    });
    if (!member) throw new ForbiddenException('Not a member of the farm owning these resources');

    if (job.status === 'completed' || job.status === 'cancelled') {
      throw new BadRequestException(`Cannot ingest telemetry for a ${job.status} job`);
    }

    // Stop simulator if real data arrives for this job
    this.stopSimulator(dto.jobId);

    const data = dto.points.map(p => ({
      tractorId: dto.tractorId,
      jobId: dto.jobId,
      recordedAt: new Date(p.recordedAt),
      location_wkt: p.location,
      speedKmph: p.speedKmph,
      headingDeg: p.headingDeg,
      infectionIntensity: p.infectionIntensity,
      heatWeight: p.heatWeight,
      progressPercent: p.progressPercent,
      extra: p.extra ? JSON.stringify(p.extra) : undefined
    }));

    // Broadcast the latest point to live clients
    if (data.length > 0) {
      const last = data[data.length - 1];
      // Regex to parse "POINT(lng lat)"
      const coords = last.location_wkt.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
      const [lng, lat] = coords ? [parseFloat(coords[1]), parseFloat(coords[2])] : [0, 0];

      this.gateway.broadcastUpdate(dto.jobId, {
        tractorId: dto.tractorId,
        jobId: dto.jobId,
        point: {
          lat,
          lng,
          recordedAt: last.recordedAt,
          speedKmph: last.speedKmph,
          headingDeg: last.headingDeg,
          infectionIntensity: last.infectionIntensity,
          heatWeight: last.heatWeight,
          progressPercent: last.progressPercent,
        },
        isDemo: false
      } as LiveTelemetryPayload);
    }

    // Use raw SQL for PostGIS/Unsupported type support
    let ingested = 0;
    for (const p of data) {
      try {
        await this.prisma.$executeRaw`
          INSERT INTO telemetry_points (
            tractor_id, job_id, recorded_at, location, 
            speed_kmph, heading_deg, infection_intensity, 
            heat_weight, progress_percent, extra
          ) VALUES (
            ${p.tractorId}, ${p.jobId}, ${p.recordedAt}, 
            ST_GeomFromText(${p.location_wkt || 'POINT(0 0)'}, 4326), 
            ${p.speedKmph}, ${p.headingDeg}, ${p.infectionIntensity}, 
            ${p.heatWeight}, ${p.progressPercent}, ${p.extra ? JSON.parse(p.extra) : null}
          )
        `;
        ingested++;
      } catch (e) {
        this.logger.error(`Failed to ingest point: ${e.message}`);
      }
    }

    return { ingested };
  }

  /**
   * Starts a boustrophedon simulator for a specific job.
   * Emits points every 500ms.
   */
  startSimulator(jobId: string, tractorId: string) {
    if (this.activeSimulators.has(jobId)) return;

    this.logger.log(`Starting simulator for job ${jobId}`);

    // Boustrophedon config
    const startLat = 15.0;
    const startLng = 10.0;
    const endLat = 85.0;
    const endLng = 90.0;
    const laneWidth = 5.0;
    const step = 2.0;

    let currentLat = startLat;
    let currentLng = startLng;
    let movingEast = true;
    let progress = 0;

    const interval = setInterval(() => {
      // Move lat/lng in boustrophedon pattern
      if (movingEast) {
        currentLng += step;
        if (currentLng >= endLng) {
          currentLng = endLng;
          currentLat += laneWidth;
          movingEast = false;
        }
      } else {
        currentLng -= step;
        if (currentLng <= startLng) {
          currentLng = startLng;
          currentLat += laneWidth;
          movingEast = true;
        }
      }

      progress += 0.5;
      if (currentLat > endLat || progress >= 100) {
        this.stopSimulator(jobId);
        return;
      }

      const payload: LiveTelemetryPayload = {
        tractorId,
        jobId,
        point: {
          lat: currentLat,
          lng: currentLng,
          recordedAt: new Date(),
          speedKmph: 12.5,
          headingDeg: movingEast ? 90 : 270,
          infectionIntensity: Math.random() * 0.4,
          heatWeight: 15,
          progressPercent: progress,
        },
        isDemo: true
      };

      this.gateway.broadcastUpdate(jobId, payload);
    }, 500);

    this.activeSimulators.set(jobId, interval);
  }

  stopSimulator(jobId: string) {
    const interval = this.activeSimulators.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.activeSimulators.delete(jobId);
      this.logger.log(`Stopped simulator for job ${jobId}`);
    }
  }
}
