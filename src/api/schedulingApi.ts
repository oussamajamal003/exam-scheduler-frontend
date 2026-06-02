import { axiosClient } from "./axiosclient";
import type {
  GenerateScheduleDto,
  GenerateScheduleResponse,
  Schedule,
} from "../schemas/schedule";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

const unwrap = <T,>(payload: ApiEnvelope<T> | undefined, label: string): T => {
  if (!payload?.data) throw new Error(`${label} response missing data`);
  return payload.data;
};

// -------------------- Shared DTO --------------------

// Flexible body accepted by prepare / validate-input / generate
export type PrepareSchedulingDto = {
  semesterId?: string;
  /** ISO datetime – required by /prepare */
  startDate?: string;
  /** ISO datetime – required by /prepare */
  endDate?: string;
  centerIds?: string[];
  examIds?: string[];
  options?: Record<string, unknown>;
};

export type ValidateSchedulingInputDto = PrepareSchedulingDto;

// -------------------- POST /api/scheduling/prepare --------------------

export type PrepareSchedulingMissingItem = {
  entity: string;
  reason: string;
};

export type PrepareSchedulingResult = {
  // Core counts
  activeCourseOfferingsCount: number;
  roomsCount: number;
  availableRoomsCount: number;
  proctorsCount: number;
  timeSlotsCount: number;
  // Overall readiness
  readinessStatus: "ready" | "partial" | "not_ready" | string;
  // Items that are missing or misconfigured
  missingData: PrepareSchedulingMissingItem[];
  // Optional extras the backend may include
  semester?: { id: string; name: string } | null;
  examsCount?: number;
  studentsCount?: number;
  [key: string]: unknown;
};

export const prepareScheduling = async (
  payload: PrepareSchedulingDto = {}
): Promise<PrepareSchedulingResult> => {
  const response = await axiosClient.post<ApiEnvelope<PrepareSchedulingResult>>(
    "/scheduling/prepare",
    payload
  );
  const raw = unwrap(response.data, "Prepare scheduling") as Record<string, unknown>;

  // Backend returns { semester, requestedWindow, resources: { courseOfferings, rooms, proctors, timeSlotsInWindow, ... } }
  // Normalize to the flat PrepareSchedulingResult shape the UI expects.
  const res = (raw.resources ?? {}) as Record<string, unknown>;
  const offerings = (res.courseOfferings as number) ?? 0;
  const rooms     = (res.rooms        as number) ?? 0;
  const proctors = (res.proctors as number) ?? 0;
  const slots     = (res.timeSlotsInWindow as number) ?? 0;

  return {
    ...raw,
    activeCourseOfferingsCount: offerings,
    roomsCount:                 rooms,
    availableRoomsCount:        rooms,   // backend query already filters status = 'AVAILABLE'
    proctorsCount:           proctors,
    timeSlotsCount:             slots,
    examsCount:                 (res.exams as number) ?? offerings,
    studentsCount:              (res.studentsWithExams as number) ?? 0,
    readinessStatus:
      offerings > 0 && rooms > 0 && proctors > 0 && slots > 0
        ? "ready"
        : "partial",
    missingData: (raw.missingData as PrepareSchedulingResult["missingData"]) ?? [],
    semester: (raw.semester as PrepareSchedulingResult["semester"]) ?? null,
  } as PrepareSchedulingResult;
};

// -------------------- POST /api/scheduling/validate-input --------------------

export type ValidationGroup = {
  ok: boolean;
  issues: string[];
};

/** Per-offering breakdown used in validate details */
export type OfferingRegistrationDetail = {
  offeringId: string;
  courseCode?: string | null;
  courseTitle?: string | null;
  semesterName?: string | null;
  registrationsCount: number;
  maxRoomCapacity: number;
  /** true when maxRoomCapacity < registrationsCount */
  capacityInsufficient: boolean;
};

/** Detailed statistics returned alongside validation result */
export type ValidateSchedulingDetails = {
  activeCourseOfferingsCount: number;
  timeSlotsCount: number;
  availableRoomsCount: number;
  proctorsCount: number;
  /** Per-offering registration + capacity breakdown */
  offeringRegistrations?: OfferingRegistrationDetail[];
  [key: string]: unknown;
};

/** Errors grouped by category (key = category label, value = error messages) */
export type ValidateSchedulingErrors = Record<string, string[]>;

export type BlockingSchedulingConflict = {
  scheduleId?: string;
  type: string;
  description: string;
};

export type SchedulingRiskAnalysis = {
  blocking: BlockingSchedulingConflict[];
  blockingCount: number;
  schedulableExamsCount: number;
  totalExamsCount: number;
  softPenalty?: number;
};

export type SchedulingQualitySummary = {
  originalScore: number;
  optimizedScore: number;
  weakAreas: { area: string; score: number }[];
  qualityMetrics: Record<string, number | string | Record<string, number>>;
};

export type SchedulingAlgorithmInfo = {
  type: string;
  pipeline: string[];
  strategy?: string;
  usesBruteForce: boolean;
  lookupTables: string[];
};

export type ValidateSchedulingResult = {
  // New unified flag (mirrors `ready`)
  isValid: boolean;
  // Legacy flag kept for backward compat with existing page code
  ready: boolean;
  // Grouped error messages by category
  errors: ValidateSchedulingErrors;
  // Non-blocking advisory messages
  warnings: string[];
  // Detailed breakdown for the UI
  details?: ValidateSchedulingDetails;
  // Optional semester context
  semester?: { name: string } | null;
  riskAnalysis?: SchedulingRiskAnalysis;
  algorithm?: SchedulingAlgorithmInfo;
  quality?: SchedulingQualitySummary;
  // Legacy flat metrics (kept for the generate dialog)
  metrics: {
    roomsCount: number;
    proctorsCount: number;
    examsCount: number;
    timeSlotsCount: number;
    studentsWithExamsCount: number;
    existingAssignmentsCount: number;
    schedulableExamsCount?: number;
    blockingIssuesCount?: number;
    [key: string]: unknown;
  };
  // Legacy grouped validation results
  groups: {
    rooms: ValidationGroup;
    proctors: ValidationGroup;
    timeSlots: ValidationGroup;
    courseOfferings: ValidationGroup;
    enrollments: ValidationGroup;
    studentOverlapRisks: ValidationGroup;
    [key: string]: ValidationGroup;
  };
  // Flat issue list (legacy)
  issues: string[];
};

export const validateSchedulingInput = async (
  payload: ValidateSchedulingInputDto = {}
): Promise<ValidateSchedulingResult> => {
  const response = await axiosClient.post<ApiEnvelope<ValidateSchedulingResult>>(
    "/scheduling/validate-input",
    payload
  );
  const result = unwrap(response.data, "Validate scheduling input");
  // Normalise: ensure isValid and ready are always in sync regardless of which
  // field the backend populates.
  result.isValid = result.isValid ?? result.ready ?? false;
  result.ready = result.ready ?? result.isValid;
  result.errors = result.errors ?? {};
  result.warnings = result.warnings ?? [];
  result.metrics = result.metrics ?? {
    roomsCount: 0,
    proctorsCount: 0,
    examsCount: 0,
    timeSlotsCount: 0,
    studentsWithExamsCount: 0,
    existingAssignmentsCount: 0,
    schedulableExamsCount: 0,
    blockingIssuesCount: 0,
  };
  result.groups = result.groups ?? {
    rooms: { ok: true, issues: [] },
    proctors: { ok: true, issues: [] },
    timeSlots: { ok: true, issues: [] },
    courseOfferings: { ok: true, issues: [] },
    enrollments: { ok: true, issues: [] },
    studentOverlapRisks: { ok: true, issues: [] },
  };
  result.issues = result.issues ?? [];
  result.riskAnalysis = result.riskAnalysis ?? {
    blocking: [],
    blockingCount: 0,
    schedulableExamsCount: 0,
    totalExamsCount: result.metrics.examsCount ?? 0,
  };
  return result;
};

// -------------------- POST /api/scheduling/generate --------------------

export type ScheduleAnalysis = {
  scheduleId: string;
  summary?: Record<string, unknown>;
  conflicts?: unknown[];
  metrics?: Record<string, unknown>;
  [key: string]: unknown;
};

export const generateSchedule = async (
  payload: GenerateScheduleDto
): Promise<GenerateScheduleResponse> => {
  const response = await axiosClient.post<ApiEnvelope<GenerateScheduleResponse>>(
    "/scheduling/generate",
    payload
  );
  return unwrap(response.data, "Generate schedule");
};

// GET /api/scheduling/:id/analysis
export const fetchScheduleAnalysis = async (id: string): Promise<ScheduleAnalysis> => {
  const response = await axiosClient.get<ApiEnvelope<ScheduleAnalysis>>(
    `/scheduling/${id}/analysis`
  );
  return unwrap(response.data, "Schedule analysis");
};

export type PublishScheduleDto = {
  examPeriod: string;
};

export type PublishScheduleResult = {
  schedule: Schedule;
  eventType: 'SCHEDULE_PUBLISHED' | 'SCHEDULE_REPUBLISHED' | null;
  scheduleVersion: number | null;
};

// PATCH /api/scheduling/:id/publish
export const publishSchedule = async (
  id: string,
  payload: PublishScheduleDto
): Promise<PublishScheduleResult> => {
  const response = await axiosClient.patch<ApiEnvelope<PublishScheduleResult>>(
    `/scheduling/${id}/publish`,
    payload
  );
  return unwrap(response.data, "Publish schedule");
};
