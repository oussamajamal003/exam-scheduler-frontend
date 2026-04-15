import { axiosClient } from './axiosclient';
import { Student, StudentFormData } from '../schemas/student';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type StudentsServicePayload = {
  data: Array<{
    id: string;
    universityId: string;
    user?: {
      name?: string;
      email?: string;
    };
    program?: {
      name?: string;
    };
  }>;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type StudentRecord = {
  id: string;
  universityId: string;
  user?: {
    name?: string;
    email?: string;
  };
  program?: {
    name?: string;
  };
};

type SignupResponse = {
  token: string;
  message?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
};

export type CreateStudentInput = StudentFormData & {
  password: string;
};

export type GetStudentsParams = {
  search?: string;
  page?: number;
  limit?: number;
};

const mapStudent = (item: StudentRecord): Student => ({
  id: item.id,
  name: item.user?.name ?? 'Unknown',
  email: item.user?.email ?? '',
  studentId: item.universityId,
  department: item.program?.name,
  level: undefined,
  createdAt: '',
  updatedAt: '',
});

export const getStudents = async (params: GetStudentsParams = {}): Promise<Student[]> => {
  const response = await axiosClient.get<ApiResponse<StudentsServicePayload>>('/students', { params });
  const students = response.data?.data?.data;
  return Array.isArray(students) ? students.map(mapStudent) : [];
};

export const createStudent = async (data: CreateStudentInput): Promise<Student> => {
  const signupResponse = await axiosClient.post<SignupResponse>('/auth/signup', {
    name: data.name,
    email: data.email,
    password: data.password,
    role: 'STUDENT',
  });

  const studentResponse = await axiosClient.post<ApiResponse<StudentRecord>>('/students', {
    userId: signupResponse.data.user.id,
    universityId: data.studentId,
  });

  return mapStudent(studentResponse.data.data);
};

export const updateStudent = async (id: string, data: StudentFormData): Promise<Student> => {
  const response = await axiosClient.put<ApiResponse<Student>>(`/students/${id}`, data);
  return response.data.data;
};

export const deleteStudent = async (id: string): Promise<void> => {
  await axiosClient.delete(`/students/${id}`);
};
