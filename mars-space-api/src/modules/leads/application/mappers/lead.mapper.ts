import { Lead } from '../../domain/entities/lead.entity';
import { LeadResponseDto } from '../dto/lead.dto';

export class LeadMapper {
  static toResponse(lead: Lead): LeadResponseDto {
    return {
      id: lead.id,
      fullName: lead.fullName,
      phone: lead.phone,
      courseId: lead.courseId,
      course: lead.course
        ? { id: lead.course.id, slug: lead.course.slug, title: lead.course.title }
        : null,
      message: lead.message,
      source: lead.source,
      status: lead.status,
      assignedToId: lead.assignedToId,
      assignedTo: lead.assignedTo
        ? {
            id: lead.assignedTo.id,
            fullName: lead.assignedTo.fullName,
            email: lead.assignedTo.email,
          }
        : null,
      adminNote: lead.adminNote,
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      pageUrl: lead.pageUrl,
      contactedAt: lead.contactedAt,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }

  static toResponseList(leads: Lead[]): LeadResponseDto[] {
    return leads.map((lead) => LeadMapper.toResponse(lead));
  }
}
