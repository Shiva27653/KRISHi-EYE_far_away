import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateJobDto, UpdateJobDto, JobStatus } from './dto/job.dto';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(dto: CreateJobDto, userId: string): Promise<any> {
    const tractor = await this.prisma.tractor.findUnique({ where: { id: dto.tractor_id } });
    if (!tractor) throw new NotFoundException('Tractor not found');

    const field = await this.prisma.field.findUnique({ where: { id: dto.field_id } });
    if (!field) throw new NotFoundException('Field not found');

    if (tractor.farmId !== field.farmId) {
      throw new BadRequestException('Tractor and Field must belong to the same farm');
    }

    const member = await this.prisma.farmMember.findFirst({
      where: { farmId: tractor.farmId, userId: userId }
    });
    if (!member) throw new ForbiddenException('Not a member of the farm owning these resources');

    return this.prisma.operationJob.create({
      data: {
        tractorId: dto.tractor_id,
        fieldId: dto.field_id,
        status: dto.status || JobStatus.PENDING,
        startedAt: dto.status === JobStatus.RUNNING ? new Date() : undefined,
      }
    });
  }

  async findAll(userId: string): Promise<any[]> {
    const memberships = await this.prisma.farmMember.findMany({ where: { userId: userId } });
    const farmIds = memberships.map(m => m.farmId);
    if (farmIds.length === 0) return [];

    const tractors = await this.prisma.tractor.findMany({
      where: { farmId: { in: farmIds } },
      select: { id: true }
    });
    const tractorIds = tractors.map(t => t.id);
    if (tractorIds.length === 0) return [];

    return this.prisma.operationJob.findMany({
      where: { tractorId: { in: tractorIds } },
      include: { tractor: true, field: true },
    });
  }

  async findOne(id: string): Promise<any> {
    const job = await this.prisma.operationJob.findUnique({
      where: { id },
      include: { 
        tractor: { include: { farm: true } },
        field: true 
      },
    });
    if (!job) throw new NotFoundException(`Job with ID ${id} not found`);
    return job;
  }

  async update(id: string, dto: UpdateJobDto): Promise<any> {
    const job = await this.findOne(id);

    if (dto.status && dto.status !== job.status) {
      if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) {
        throw new BadRequestException(`Cannot change status of a ${job.status} job`);
      }
    }

    return this.prisma.operationJob.update({
      where: { id },
      data: {
        status: dto.status || undefined,
        startedAt: (dto.status === JobStatus.RUNNING && !job.startedAt) ? new Date() : undefined,
        endedAt: (dto.status === JobStatus.COMPLETED || dto.status === JobStatus.CANCELLED) ? new Date() : undefined,
      }
    });
  }

  async getReplayData(id: string) {
    const points: any[] = await this.prisma.$queryRaw`
      SELECT 
        recorded_at as "recordedAt",
        ST_X(location::geometry) as lng,
        ST_Y(location::geometry) as lat,
        speed_kmph as "speedKmph",
        heading_deg as "headingDeg",
        infection_intensity as "infectionIntensity",
        progress_percent as "progressPercent"
      FROM telemetry_points
      WHERE job_id = ${id}
      ORDER BY recorded_at ASC
    `;
    
    return {
      jobId: id,
      points: points.map(p => ({
        ...p,
        lat: Number(p.lat),
        lng: Number(p.lng)
      }))
    };
  }

  async getHeatmapData(id: string) {
    const points: any[] = await this.prisma.$queryRaw`
      SELECT 
        ST_X(location::geometry) as lng,
        ST_Y(location::geometry) as lat,
        heat_weight as weight,
        infection_intensity as intensity
      FROM telemetry_points
      WHERE job_id = ${id}
    `;

    return {
      jobId: id,
      heatmap: points.map(p => ({
        ...p,
        lat: Number(p.lat),
        lng: Number(p.lng),
        weight: Number(p.weight),
        intensity: Number(p.intensity)
      }))
    };
  }
}
