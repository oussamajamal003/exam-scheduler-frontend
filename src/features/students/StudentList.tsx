import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Student } from "../../schemas/student";
import { Edit2, Trash2, BookOpen } from "lucide-react";
import { cn } from "../../lib/utils";
import { TableSkeletonRows } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/shared/EmptyState";

interface StudentListProps {
  students: Student[];
  isLoading?: boolean;
  isDeleting?: boolean;
  search?: string;
  onAdd?: () => void;
  onEditStudent: (student: Student) => void;
  onViewExams: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
}

export function StudentList({ students, isLoading, isDeleting, search, onAdd, onEditStudent, onViewExams, onDeleteStudent }: StudentListProps) {
  const studentRows = Array.isArray(students) ? students : [];

  return (
    <Card className="overflow-hidden rounded-none border border-zinc-200/80 bg-white/90 shadow-lg shadow-zinc-200/40">
      <CardHeader className="flex flex-col gap-4 border-b border-zinc-200/60 px-4 py-5 sm:px-6 sm:py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-none bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm shadow-zinc-950/10">
            Directory
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">Student Management</CardTitle>
          <p className="text-sm leading-6 text-zinc-500 max-w-2xl">Browse student records, edit profiles, review exam status, and manage your enrollment system with precision.</p>
        </div>
        <div className="flex items-center gap-2 rounded-none bg-linear-to-br from-zinc-50 to-zinc-100/80 px-5 py-3 border border-zinc-200/60 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Total Students</p>
            <p className="text-3xl font-bold tracking-tight text-zinc-950 mt-1">{studentRows.length}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b border-zinc-200/60 hover:bg-transparent bg-zinc-50/40">
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Univ. ID</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Name</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Email</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Program</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Department</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Exams</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <TableSkeletonRows columns={7} rows={studentRows.length > 0 ? studentRows.length : 10} />
                  </TableCell>
                </TableRow>
              ) : studentRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    {search?.trim() ? (
                      <EmptyState
                        icon={BookOpen}
                        title="No results found"
                        description={`No students match "${search.trim()}". Try a different search term.`}
                      />
                    ) : (
                      <EmptyState
                        icon={BookOpen}
                        title="No students yet"
                        description="Create your first student record to get started with exam scheduling."
                        action={onAdd ? { label: "Add Student", onClick: onAdd } : undefined}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                studentRows.map((student, idx) => (
                  <TableRow
                    key={student.id}
                    className={cn(
                      "border-b border-zinc-200/40 transition-all duration-200 hover:bg-zinc-50/60",
                      idx === studentRows.length - 1 && "border-b-0"
                    )}
                  >
                    <TableCell className="px-4 py-4 sm:px-6">
                      <span className="font-bold text-zinc-950 text-sm">{student.universityId}</span>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <div className="font-semibold text-zinc-950 text-sm">{student.user?.name ?? `${student.firstName} ${student.lastName}`}</div>
                      <p className="text-xs text-zinc-500 mt-0.5">Active student</p>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-sm text-zinc-600">{student.user?.email ?? student.email}</TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-sm text-zinc-700">
                      {student.programRef?.name ?? (student.program?.trim() ? student.program : <span className="text-zinc-400">Unassigned</span>)}
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-sm text-zinc-700">
                      {student.department?.trim() ? student.department : <span className="text-zinc-400">—</span>}
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewExams(student)}
                        className="h-8 rounded-none text-xs font-semibold text-zinc-600 hover:bg-blue-100/50 hover:text-blue-700 transition-colors"
                      >
                        <BookOpen className="size-3.5 mr-1.5" />
                        Exams
                      </Button>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditStudent(student)}
                          className="h-8 w-8 rounded-none text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors p-0 flex items-center justify-center"
                          title="Edit student"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => onDeleteStudent(student)}
                          className="h-8 w-8 rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors p-0 flex items-center justify-center disabled:opacity-50"
                          title="Delete student"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
