import React from 'react';
import { useCreateStudent, useDeleteStudent, useStudents } from '../../hooks/students/useStudents';
import { Button } from '../../components/ui/button';
import { PlusCircle, Search, Trash2, GraduationCap } from 'lucide-react';

export const StudentList: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const { data: students, isLoading, isError } = useStudents(search);
  const createStudentMutation = useCreateStudent();
  const deleteStudentMutation = useDeleteStudent();
  const studentRows = Array.isArray(students) ? students : [];

  const handleCreateStudent = async () => {
    const name = window.prompt('Student full name');
    if (!name) return;

    const email = window.prompt('Student email');
    if (!email) return;

    const studentId = window.prompt('University ID');
    if (!studentId) return;

    const password = window.prompt('Temporary password (min 6 characters)', 'student123');
    if (!password || password.length < 6) {
      window.alert('Password must be at least 6 characters.');
      return;
    }

    try {
      await createStudentMutation.mutateAsync({
        name,
        email,
        studentId,
        password,
      });
      window.alert('Student created successfully.');
    } catch {
      window.alert('Failed to create student. Check console/server logs.');
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    const confirmed = window.confirm(`Delete ${name}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteStudentMutation.mutateAsync(id);
    } catch {
      window.alert('Failed to delete student.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-muted-foreground animate-pulse">
        <GraduationCap className="h-12 w-12 mb-4 opacity-20" />
        <span className="text-lg font-medium">Loading student records...</span>
      </div>
    );
  }

  if (isError) return <div className="p-8 text-center text-destructive bg-destructive/10 rounded-xl">Error loading student data.</div>;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9 pr-4 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary w-64 bg-background"
            />
          </div>
        </div>
        <Button
          onClick={handleCreateStudent}
          disabled={createStudentMutation.isPending}
          className="w-full sm:w-auto shadow-sm gap-2 whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{createStudentMutation.isPending ? 'Adding...' : 'Add Student'}</span>
        </Button>
      </div>
      
      {/* Data Table Card */}
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Student Name</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Registration ID</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Email Address</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Department</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {studentRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground bg-muted/20">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-background border border-border rounded-full flex items-center justify-center text-muted-foreground">
                        <Search className="w-5 h-5 opacity-50" />
                      </div>
                      <p className="font-medium">No students found</p>
                      <p className="text-xs max-w-sm">There are no students matching your criteria, or none have been added to the system yet.</p>
                      <Button variant="link" onClick={handleCreateStudent} className="mt-2 text-primary gap-1">
                        Add the first student <PlusCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                studentRows.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shadow-sm border border-primary/20">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{student.studentId}</td>
                    <td className="px-6 py-4 text-muted-foreground">{student.email}</td>
                    <td className="px-6 py-4">
                      {student.department ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                          {student.department}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteStudent(student.id, student.name)}
                        disabled={deleteStudentMutation.isPending}
                        title="Delete student"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="border-t border-border px-6 py-4 bg-muted/20 flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing <span className="font-medium text-foreground">{studentRows.length}</span> students</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};