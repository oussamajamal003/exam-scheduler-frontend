import { useState } from "react";
import { StudentList } from "../../features/students/StudentList";
import { StudentForm } from "../../forms/students/StudentForm";
import { useCreateStudent, useDeleteStudent, useStudentExams, useStudents, useUpdateStudent } from "../../hooks/students/useStudents";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Student } from "../../schemas/student";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getApiErrorMessage } from "../../lib/apiError";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";

export function StudentsPage() {
  const { data: students = [], isLoading, isError, error } = useStudents();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [examStudent, setExamStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();
  const examsQuery = useStudentExams(examStudent?.id);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreateModal = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = (data: Student) => {
    if (editingStudent?.id) {
      updateMutation.mutate(
        { id: editingStudent.id, data },
        {
          onSuccess: () => {
            closeFormModal();
          },
        }
      );
      return;
    }

    createMutation.mutate(data, {
      onSuccess: () => {
        closeFormModal();
      },
    });
  };

  const handleDelete = (student: Student) => {
    setDeletingStudent(student);
  };

  const closeDeleteModal = () => {
    setDeletingStudent(null);
    deleteMutation.reset();
  };

  const confirmDelete = () => {
    if (!deletingStudent?.id) return;

    deleteMutation.mutate(deletingStudent.id, {
      onSuccess: () => {
        closeDeleteModal();
      },
    });
  };

  const exams = examsQuery.data ?? [];
  const pageErrorMessage = getApiErrorMessage(error, "Failed to load students.");
  const examErrorMessage = getApiErrorMessage(examsQuery.error, "Failed to load student exams.");

  if (isLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading students" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card className="p-6 space-y-3">
          <p className="text-sm text-red-600">{pageErrorMessage}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Card className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 shadow-md shadow-zinc-200/40">
        <CardHeader className="grid gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-[1.35fr_auto] lg:items-center">
          <div className="space-y-3">
            <div className="inline-flex rounded-full bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 shadow-sm shadow-zinc-950/10">
              Student Management
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">Students</CardTitle>
            <p className="max-w-2xl text-sm leading-6 text-zinc-500">
              Manage student records, view exam details, and keep your scheduling roster polished and connected.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:w-auto">
            <Button className="h-10 rounded-xl bg-zinc-950 px-4 text-white shadow-sm shadow-zinc-950/10 transition-colors hover:bg-zinc-900 sm:h-11 sm:rounded-full" onClick={openCreateModal}>
              Add New Student
            </Button>
            <Button variant="outline" className="h-10 rounded-xl border-zinc-200 text-zinc-950 hover:bg-zinc-50 sm:h-11 sm:rounded-full" onClick={() => window.location.reload()}>
              Refresh List
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 sm:p-6 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 sm:p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Total students</p>
            <p className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">{students.length}</p>
            <p className="mt-2 text-sm text-zinc-500">Active profiles currently available in the system.</p>
          </div>
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 sm:p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Quick actions</p>
            <p className="mt-4 text-sm leading-6 text-zinc-500">Use the action panel below to update student details or review exam records with confidence.</p>
          </div>
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 sm:p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">System status</p>
            <p className="mt-4 text-sm leading-6 text-zinc-500">Everything is synced in real time, with fast student updates and secure enrollment management.</p>
          </div>
        </CardContent>
      </Card>

      {(createMutation.isError || updateMutation.isError) && (
        <div className="grid gap-4 md:grid-cols-2">
          {createMutation.isError && (
            <Card className="rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold">Create Error</p>
                <p className="mt-2 text-sm">{getApiErrorMessage(createMutation.error, "Failed to create student.")}</p>
              </CardContent>
            </Card>
          )}
          {updateMutation.isError && (
            <Card className="rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold">Update Error</p>
                <p className="mt-2 text-sm">{getApiErrorMessage(updateMutation.error, "Failed to update student.")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <StudentList
        students={students}
        isDeleting={deleteMutation.isPending}
        onEditStudent={openEditModal}
        onViewExams={setExamStudent}
        onDeleteStudent={handleDelete}
      />

      <DeleteConfirmModal
        open={Boolean(deletingStudent)}
        title="Delete Student"
        description={
          deletingStudent
            ? `This will permanently delete ${deletingStudent.firstName} ${deletingStudent.lastName} and remove related student records from the database.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete Student"
        isLoading={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? getApiErrorMessage(deleteMutation.error, "Failed to delete student.")
            : undefined
        }
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <StudentForm
              initialData={editingStudent ?? undefined}
              onSubmit={handleSubmit}
              isLoading={isSaving}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(examStudent)} onOpenChange={(open) => !open && setExamStudent(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {examStudent ? `${examStudent.firstName} ${examStudent.lastName} Exams` : "Student Exams"}
            </DialogTitle>
          </DialogHeader>

          {examsQuery.isLoading && <PageSpinner label="Loading exams" className="min-h-55" />}

          {examsQuery.isError && <div className="py-6 text-sm text-red-600">{examErrorMessage}</div>}

          {!examsQuery.isLoading && !examsQuery.isError && (
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                        No exams found for this student.
                      </TableCell>
                    </TableRow>
                  ) : (
                    exams.map((exam, index) => (
                      <TableRow key={`${exam.courseCode}-${index}`}>
                        <TableCell className="font-medium">{exam.courseName}</TableCell>
                        <TableCell>{exam.courseCode}</TableCell>
                        <TableCell>{exam.status ?? "Pending"}</TableCell>
                        <TableCell>{exam.duration ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
