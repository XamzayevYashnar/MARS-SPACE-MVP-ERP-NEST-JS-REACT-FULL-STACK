import { Paginated } from '../../../../common/interfaces';
import {
  CreateLeadData,
  Lead,
  LeadQuery,
  LeadStatusCounts,
  LeadTrendPoint,
  TopCourseByLeads,
  UpdateLeadData,
} from '../entities/lead.entity';

export abstract class LeadRepository {
  abstract findMany(query: LeadQuery): Promise<Paginated<Lead>>;
  abstract findById(id: string): Promise<Lead | null>;
  abstract create(data: CreateLeadData): Promise<Lead>;
  abstract update(id: string, data: UpdateLeadData): Promise<Lead>;
  abstract delete(id: string): Promise<void>;

  /**
   * §6.4.3 — creates the student and flips the lead to ENROLLED atomically.
   * Returning the pair lets the controller answer with both without a re-read.
   */
  abstract convertToStudent(input: {
    leadId: string;
    groupId: string;
    note?: string | null;
  }): Promise<{ lead: Lead; studentId: string }>;

  // ── Dashboard aggregates ─────────────────────────────────────
  abstract countByStatus(): Promise<LeadStatusCounts>;
  abstract countSince(since: Date): Promise<number>;
  abstract trend(since: Date): Promise<LeadTrendPoint[]>;
  abstract topCourses(limit: number): Promise<TopCourseByLeads[]>;
  abstract recent(limit: number): Promise<Lead[]>;
}
