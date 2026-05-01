export type ConflictType =
  | "STUDENT_CONFLICT"
  | "ROOM_CONFLICT"
  | "SUPERVISOR_CONFLICT"
  | "ROOM_OVERCAPACITY"
  | "TIME_CONSTRAINT_VIOLATION"
  | "SUPERVISOR_DOUBLE_BOOKED"
  | "STUDENT_OVERLAP"
  | "RESOURCE_UNAVAILABLE"
  | string;

export type Conflict = {
  id?: string;
  scheduleId?: string;
  type: ConflictType;
  description: string;
  resolved?: boolean;
  createdAt?: string;
  // Detection-time helpers (not stored in DB)
  entity?: string;
  suggestedFix?: string;
  conflictType?: ConflictType;
};

export type DetectConflictsDto = {
  scheduleId: string;
};

export type DetectConflictsResponse = {
  scheduleId: string;
  detectedCount: number;
  conflicts: Conflict[];
};
