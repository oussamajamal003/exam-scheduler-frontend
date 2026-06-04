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
  proctors: number;
  students: number;
  timeSlots: number;
  registrations: number;
  schedules?: number;
};

export type DemoDataResult = {
  message: string;
  dataset?: 'A' | 'B' | 'C' | 'REAL' | 'FEIT2027' | 'FAIL' | 'FAIL2' | 'FAIL3';
  datasetLabel?: string;
  loginHint?: string;
  summary: DemoDataSummary;
  overallSummary?: DemoDataSummary;
  instruction?: string;
  expectedTestCases?: {
    dataset?: string;
    expectedResult?: string;
    offerings?: string;
    rooms?: string;
    proctors?: string;
    timeSlots?: string;
  };
};

export type GenerateDemoDataDto = {
  dataset?: 'A' | 'B' | 'C' | 'REAL' | 'FEIT2027' | 'FAIL' | 'FAIL2' | 'FAIL3';
};

export type ClearDemoDataDto = {
  dataset?: 'A' | 'B' | 'C' | 'REAL' | 'FEIT2027' | 'FAIL' | 'FAIL2' | 'FAIL3';
};

const unwrap = <T,>(payload: ApiEnvelope<T> | undefined, label: string): T => {
  if (!payload?.data) throw new Error(`${label} response missing data`);
  return payload.data;
};

export const generateDemoData = async (payload: GenerateDemoDataDto = {}): Promise<DemoDataResult> => {
  const response = await axiosClient.post<ApiEnvelope<DemoDataResult>>('/demo-data/generate', payload);
  return unwrap(response.data, 'Generate demo data');
};

export const clearDemoData = async (payload: ClearDemoDataDto = {}): Promise<DemoDataResult> => {
  const response = await axiosClient.delete<ApiEnvelope<DemoDataResult>>('/demo-data/clear', {
    data: payload,
  });
  return unwrap(response.data, 'Clear demo data');
};
