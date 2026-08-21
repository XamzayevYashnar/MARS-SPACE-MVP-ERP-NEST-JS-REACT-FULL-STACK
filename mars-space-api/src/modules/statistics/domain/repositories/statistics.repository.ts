/** Counts the dashboard needs that no single feature repository owns. */
export interface EntityTotals {
  publishedCourses: number;
  activeGroups: number;
  activeStudents: number;
}

/**
 * Port for the cross-module aggregates of §6.3.
 *
 * Lead-specific numbers come from `LeadRepository`, which already owns them;
 * this port covers only the counts that span courses, groups and students, so
 * the statistics module does not have to depend on four repositories to add
 * three integers.
 */
export abstract class StatisticsRepository {
  abstract entityTotals(): Promise<EntityTotals>;
}
