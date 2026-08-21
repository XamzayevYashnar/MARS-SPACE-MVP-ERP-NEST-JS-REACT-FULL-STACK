import { create } from 'zustand';
import type { LeadSource } from '@/shared/types/common.types';

interface LeadModalState {
  open: boolean;
  /** Pre-selected course (from a course page or a Mission Board row). */
  courseId?: string;
  courseTitle?: string;
  source?: LeadSource;
  openModal: (params?: { courseId?: string; courseTitle?: string; source?: LeadSource }) => void;
  closeModal: () => void;
}

/** Global lead-modal controller so any CTA can open a pre-filled form. */
export const useLeadModal = create<LeadModalState>((set) => ({
  open: false,
  openModal: (params) =>
    set({
      open: true,
      courseId: params?.courseId,
      courseTitle: params?.courseTitle,
      source: params?.source,
    }),
  closeModal: () => set({ open: false }),
}));
