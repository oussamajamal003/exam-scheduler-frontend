import React from 'react';
import { StudentList } from '../../features/students/StudentList';
import { GraduationCap } from 'lucide-react';

export const StudentsPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col gap-1 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-primary">
          <GraduationCap className="h-8 w-8" />
          <h1 className="text-3xl font-bold tracking-tight">Students Management</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Manage student records, enrollments, and coordinate their upcoming exam schedules.
        </p>
      </div>

      <StudentList />
    </div>
  );
};