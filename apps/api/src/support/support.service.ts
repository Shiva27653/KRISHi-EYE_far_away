import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTicketDto, UpdateTicketDto, ContactQueryDto } from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async getOrganizations() {
    return this.prisma.supportOrganization.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async getContacts(query: ContactQueryDto) {
    const where: any = {};
    if (query.state) where.state = query.state;
    if (query.district) where.district = query.district;
    if (query.category) where.category = query.category;
    if (query.orgId) where.organizationId = query.orgId;

    return this.prisma.supportContact.findMany({
      where,
      include: { organization: true },
      orderBy: { contactName: 'asc' }
    });
  }

  async createTicket(dto: CreateTicketDto, userId: string) {
    if (dto.farmId) {
      const member = await this.prisma.farmMember.findFirst({
        where: { farmId: dto.farmId, userId: userId }
      });
      if (!member) throw new ForbiddenException('Not a member of the specified farm');

      if (dto.fieldId) {
        const field = await this.prisma.field.findUnique({ where: { id: dto.fieldId } });
        if (!field || field.farmId !== dto.farmId) throw new BadRequestException('Field does not belong to the farm');
      }
      if (dto.tractorId) {
        const tractor = await this.prisma.tractor.findUnique({ where: { id: dto.tractorId } });
        if (!tractor || tractor.farmId !== dto.farmId) throw new BadRequestException('Tractor does not belong to the farm');
      }
      if (dto.jobId) {
        const job = await this.prisma.operationJob.findUnique({ 
          where: { id: dto.jobId },
          include: { tractor: true }
        });
        if (!job || job.tractor.farmId !== dto.farmId) throw new BadRequestException('Job does not belong to the farm');
      }
    }

    return (this.prisma.supportTicket.create as any)({
      data: {
        userId: userId,
        farmId: dto.farmId,
        fieldId: dto.fieldId,
        tractorId: dto.tractorId,
        jobId: dto.jobId,
        title: dto.title,
        category: dto.category,
        priority: dto.priority || 'medium',
        description: dto.description,
        status: 'open',
        metadata: dto.metadata || undefined
      }
    });
  }

  async findAllTickets(userId: string) {
    const memberships = await this.prisma.farmMember.findMany({ where: { userId: userId } });
    const farmIds = memberships.map(m => m.farmId);

    return (this.prisma.supportTicket.findMany as any)({
      where: {
        OR: [
          { userId: userId },
          { farmId: { in: farmIds } }
        ]
      },
      include: {
        field: true,
        tractor: true,
        job: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOneTicket(id: string) {
    const ticket = await (this.prisma.supportTicket.findUnique as any)({
      where: { id },
      include: { 
        creator: true, 
        farm: true,
        field: true,
        tractor: true,
        job: true
      }
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async updateTicket(id: string, dto: UpdateTicketDto) {
    const ticket = await this.findOneTicket(id);

    if (dto.status) {
      if ((ticket.status === 'closed' || ticket.status === 'cancelled') && dto.status !== ticket.status) {
        throw new BadRequestException(`Cannot update status of a ${ticket.status} ticket`);
      }
    }

    return (this.prisma.supportTicket.update as any)({
      where: { id },
      data: {
        status: dto.status || undefined,
        priority: dto.priority || undefined,
        resolutionSummary: dto.resolutionSummary || undefined
      }
    });
  }

  async escalateTicket(id: string) {
    const ticket = await this.findOneTicket(id);
    if (ticket.status !== 'open' && ticket.status !== 'in_progress') {
      throw new BadRequestException('Can only escalate active tickets');
    }

    return (this.prisma.supportTicket.update as any)({
      where: { id },
      data: {
        priority: 'high',
        metadata: {
          ...(ticket.metadata as any || {}),
          escalatedAt: new Date().toISOString()
        }
      }
    });
  }

  async getKnowledge(query?: string, category?: string) {
    try {
      // Prisma doesn't have a direct LIKE equivalent for content unless we use 'contains'
      const results = await this.prisma.knowledgeSource.findMany({
        where: {
          AND: [
            category ? { title: { contains: category } } : {}, // category mapping varies
            query ? { 
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
              ] 
            } : {}
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (results.length === 0 && (process.env.APP_ENV === 'demo' || !query)) {
        return [
          {
            id: 'demo-ks-1',
            title: 'Wheat Rust Management Protocol (ICAR)',
            category: 'pest_control',
            content: 'Yellow rust (Puccinia striiformis) appears as yellow stripes on leaves. Recommended treatment includes Propiconazole 25 EC @ 0.1% or Tebuconazole 250 EC @ 0.1%. Ensure tractor speed is maintained at 4-5 km/h for precision boom spraying.',
            source_type: 'article',
            created_at: new Date()
          },
          {
            id: 'demo-ks-2',
            title: 'Precision Spraying Safety Guidelines',
            category: 'safety',
            content: 'Always wear PPE. Calibrate boom nozzles weekly. Optimal wind speed for spraying is 3-7 km/h. Avoid spraying during high heat (11 AM - 3 PM) to prevent chemical evaporation and crop stress.',
            source_type: 'guide',
            created_at: new Date()
          }
        ] as any[];
      }
      return results;
    } catch (error) {
      console.warn('Database retrieval failed, using demo fallback', error);
      return [
        {
          id: 'error-ks-1',
          title: 'Agri Advisory Fallback',
          category: 'general',
          content: 'For precision spraying advice, please consult the Krishi Vigyan Kendra (KVK) or Kisan Call Centre (1800-180-1551). Our edge sensors recommend checking local wind speed before operation.',
          source_type: 'article',
          created_at: new Date()
        }
      ] as any[];
    }
  }
}
