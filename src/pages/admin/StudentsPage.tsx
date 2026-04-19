import { useState } from "react";
import { StudentList } from "../../features/students/StudentList";
import { StudentForm } from "../../forms/students/StudentForm";
import { useCreateStudent, useDeleteStudent, useStudentExams, useStudents, useUpdateStudent } from "../../hooks/students/useStudents";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Student } from "../../schemas/student";
import { Card, CardContent } from "../../components/ui/card";
import { getApiErrorMessage } from "../../lib/apiError";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { Users, Plus, RefreshCw, TrendingUp } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50/50 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-zinc-950 text-white shadow-sm">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Students</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Manage and organize student records across your institution</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-8">
        <Button 
          onClick={openCreateModal}
          className="h-10 rounded-none bg-zinc-950 text-white font-semibold shadow-sm hover:bg-zinc-900 active:scale-95 transition-all inline-flex items-center gap-2"
        >
          <Plus className="size-4" />
          Add Student
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.location.reload()}
          className="h-10 rounded-none border-zinc-200 text-zinc-950 font-semibold hover:bg-zinc-50 active:scale-95 transition-all inline-flex items-center gap-2"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Students</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{students.length}</p>
                <p className="text-xs text-zinc-500 mt-2">Active profiles in system</p>
              </div>
              <div className="p-2 rounded-none bg-blue-50">
                <TrendingUp className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Actions Available</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">3</p>
                <p className="text-xs text-zinc-500 mt-2">Add, edit, and delete</p>
              </div>
              <div className="p-2 rounded-none bg-green-50">
                <Plus className="size-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-2">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">System Status</p>
            <p className="text-sm text-zinc-600 mt-2">Real-time sync enabled. All student records are automatically updated with exam details and enrollment information. Your data is always current and secure.</p>
            <div className="flex gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-green-600">Operational</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Messages */}
      {(createMutation.isError || updateMutation.isError) && (
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {createMutation.isError && (
            <Card className="rounded-none border border-red-200 bg-red-50 text-red-900">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold">Create Error</p>
                <p className="mt-2 text-sm">{getApiErrorMessage(createMutation.error, "Failed to create student.")}</p>
              </CardContent>
            </Card>
          )}
          {updateMutation.isError && (
            <Card className="rounded-none border border-red-200 bg-red-50 text-red-900">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold">Update Error</p>
                <p className="mt-2 text-sm">{getApiErrorMessage(updateMutation.error, "Failed to update student.")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Students List */}
      <div className="mb-8">
        <StudentList
          students={students}
          isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
          isDeleting={deleteMutation.isPending}
          onEditStudent={openEditModal}
          onViewExams={setExamStudent}
          onDeleteStudent={handleDelete}
        />
      </div>

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
