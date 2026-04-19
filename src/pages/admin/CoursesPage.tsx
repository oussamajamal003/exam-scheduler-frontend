import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { getApiErrorMessage } from "../../lib/apiError";
import { BookOpen, Plus, RefreshCw, TrendingUp } from "lucide-react";

import { CourseList } from "../../features/courses/CourseList";
import { CourseForm } from "../../forms/courses/CourseForm";
import { Course } from "../../schemas/course";
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from "../../hooks/courses/useCourses";

export function CoursesPage() {
  const { data: courses = [], isLoading, isError, error } = useCourses();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreateModal = () => {
    setEditingCourse(null);
    setIsFormOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingCourse(null);
  };

  const handleSubmit = (data: Course) => {
    if (editingCourse?.id) {
      updateMutation.mutate(
        { id: editingCourse.id, data },
        {
          onSuccess: () => {
            closeFormModal();
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          closeFormModal();
        },
      });
    }
  };

  const confirmDelete = () => {
    if (deletingCourse?.id) {
      deleteMutation.mutate(deletingCourse.id, {
        onSuccess: () => {
          setDeletingCourse(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading courses..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card className="p-6 space-y-3">
          <p className="text-sm text-red-600">{getApiErrorMessage(error, "Failed to load courses.")}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50/50 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-zinc-950 text-white shadow-sm">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Courses</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Manage and organize courses for exam scheduling and enrollment</p>
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
          Add Course
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
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Courses</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{courses.length}</p>
                <p className="text-xs text-zinc-500 mt-2">Active course offerings</p>
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
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Exam Integration</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">Enabled</p>
                <p className="text-xs text-zinc-500 mt-2">Automated exam generation</p>
              </div>
              <div className="p-2 rounded-none bg-green-50">
                <BookOpen className="size-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-2">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Curriculum Status</p>
            <p className="text-sm text-zinc-600 mt-2">Manage courses and seamlessly generate exams for scheduled sessions. Real-time synchronization ensures all course data is current and ready for exam creation and student enrollment.</p>
            <div className="flex gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-green-600">All Systems Active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Messages */}
      {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {createMutation.isError && (
            <Card className="rounded-none border border-red-200 bg-red-50 text-red-900">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold">Create Error</p>
                <p className="mt-2 text-sm">{getApiErrorMessage(createMutation.error, "Failed to create course.")}</p>
              </CardContent>
            </Card>
          )}
          {updateMutation.isError && (
            <Card className="rounded-none border border-red-200 bg-red-50 text-red-900">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold">Update Error</p>
                <p className="mt-2 text-sm">{getApiErrorMessage(updateMutation.error, "Failed to update course.")}</p>
              </CardContent>
            </Card>
          )}
          {deleteMutation.isError && (
            <Card className="rounded-none border border-red-200 bg-red-50 text-red-900">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold">Delete Error</p>
                <p className="mt-2 text-sm">{getApiErrorMessage(deleteMutation.error, "Failed to delete course.")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <CourseList
        courses={courses}
        isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
        isDeleting={deleteMutation.isPending}
        onEditCourse={openEditModal}
        onDeleteCourse={setDeletingCourse}
        onViewDetails={setDetailCourse}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <CourseForm 
              initialData={editingCourse ?? undefined} 
              onSubmit={handleSubmit} 
              isLoading={isSaving} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmModal
        open={!!deletingCourse}
        onCancel={() => setDeletingCourse(null)}
        onConfirm={confirmDelete}
        title="Delete Course"
        description={`Are you sure you want to delete ${deletingCourse?.code}? Exams and enrollments associated with this may be affected.`}
        isLoading={deleteMutation.isPending}
        errorMessage={deleteMutation.isError ? getApiErrorMessage(deleteMutation.error, "Failed to delete course.") : undefined}
      />

      <Dialog open={!!detailCourse} onOpenChange={(open) => !open && setDetailCourse(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <Card className="border border-zinc-200 shadow-sm rounded-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
                  <div>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-1">Course Code</p>
                    <h3 className="text-zinc-950 text-lg font-bold">{detailCourse?.code}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-1">Program</p>
                    <p className="text-zinc-900 font-semibold">{detailCourse?.program}</p>
                  </div>
                </div>
                <div className="pt-4 flex flex-col gap-2">
                  <p className="text-sm font-medium text-zinc-500">Course Name: <strong className="text-zinc-900">{detailCourse?.name}</strong></p>
                  <p className="text-sm font-medium text-zinc-500">Semester Term: <strong className="text-zinc-900">{detailCourse?.semester}</strong></p>
                  <p className="text-sm font-medium text-zinc-500 mt-2 italic">* Student enrollments and attached exams are fetched dynamically on schedule processing.</p>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setDetailCourse(null)} className="rounded-none font-semibold shadow-sm">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
