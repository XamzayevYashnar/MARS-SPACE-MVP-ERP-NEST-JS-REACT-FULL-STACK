import {
  CourseSyllabusModuleDto,
  LocalizedStringListDto,
} from '../../../../common/dto/localized-text.dto';
import { CourseSyllabusModule, LocalizedStringList } from '../../../../common/interfaces';
import { normalizeLocalizedText } from '../../../../common/utils/localized-text.util';
import { stripHtml, stripLocalizedHtml } from '../../../../common/utils/sanitize-html.util';

/**
 * Write-side normalisation of the course JSON columns.
 *
 * Shared by create and update so both paths store the identical shape — a
 * mismatch there would only show up later as a broken syllabus on the site.
 */

/** Guarantees the three locale keys and strips markup from every entry. */
export function normalizeStringList(
  input: LocalizedStringListDto | undefined,
): LocalizedStringList | null {
  if (!input) {
    return null;
  }

  const clean = (values: string[] | undefined): string[] =>
    (values ?? []).map((value) => stripHtml(value)).filter((value) => value.length > 0);

  return { uz: clean(input.uz), ru: clean(input.ru), en: clean(input.en) };
}

/** Renumbers the syllabus so `order` is always a contiguous 1..n sequence. */
export function normalizeSyllabus(
  input: CourseSyllabusModuleDto[] | undefined,
): CourseSyllabusModule[] | null {
  if (!input || input.length === 0) {
    return null;
  }

  return [...input]
    .sort((left, right) => left.order - right.order)
    .map((entry, index) => ({
      order: index + 1,
      title: stripLocalizedHtml(normalizeLocalizedText(entry.title)),
      durationWeeks: entry.durationWeeks,
      topics: normalizeStringList(entry.topics) ?? { uz: [], ru: [], en: [] },
    }));
}
