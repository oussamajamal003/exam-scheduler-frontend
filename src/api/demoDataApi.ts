import { axiosClient } from './axiosclient';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export type DemoDataSummary = {
  departments: number;
  programs: number;
  semesters: number;
  courses: number;
  courseOfferings: number;
  exams: number;
  centers: number;
  rooms: number;
  supervisors: number;
  students: number;
  timeSlots: number;
  registrations: number;
};

export type DemoDataResult = {
  message: string;
  loginHint?: string;
  summary: DemoDataSummary;
  expectedTestCases?: {
    normalSchedulableCount: number;
    overcapacityCourse: string;
    overlapStudentGroup: string;
    supervisorLimitedCase: string;
    invalidTimeSlotCase: string;
  };
};

const unwrap = <T,>(payload: ApiEnvelope<T> | undefined, label: string): T => {
  if (!payload?.data) throw new Error(`${label} response missing data`);
  return payload.data;
};

export const generateDemoData = async (): Promise<DemoDataResult> => {
  const response = await axiosClient.post<ApiEnvelope<DemoDataResult>>('/demo-data/generate');
  return unwrap(response.data, 'Generate demo data');
};

export const clearDemoData = async (): Promise<DemoDataResult> => {
  const response = await axiosClient.delete<ApiEnvelope<DemoDataResult>>('/demo-data/clear');
  return unwrap(response.data, 'Clear demo data');
};
