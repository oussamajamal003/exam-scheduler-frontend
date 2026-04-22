import { useDeferredValue, useMemo, useState } from 'react';
import { Building2, CalendarDays, Plus, RefreshCw, Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal';
import { DepartmentList } from '@/features/departments/DepartmentList';
import { ProgramForm, type ProgramFormSubmitValues } from '@/forms/programs/ProgramForm';
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/apiError';
import { useCreateDepartment, useDepartments, useUpdateDepartment } from '@/hooks/departments/useDepartments';
import { useCreateProgram, useDeleteProgram, usePrograms, useUpdateProgram } from '@/hooks/programs/usePrograms';
import type { Program } from '@/schemas/program';

const formatDateTime = (value?: string) => {
  if (!value) return 'Recently added';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently added';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export function DepartmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm.trim());

  const {
    data: allDepartments = [],
    isLoading: isDepartmentsLoading,
    isError: isDepartmentsError,
    error: departmentsError,
    refetch: refetchDepartments,
  } = useDepartments('');
  const {
    data: programs = [],
    isLoading: isProgramsLoading,
    isError: isProgramsError,
    error: programsError,
    refetch: refetchPrograms,
  } = usePrograms(deferredSearchTerm);

  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const createDepartmentMutation = useCreateDepartment();
  const updateDepartmentMutation = useUpdateDepartment();
  const createProgramMutation = useCreateProgram();
  const updateProgramMutation = useUpdateProgram();
  const deleteProgramMutation = useDeleteProgram();

  const totalPrograms = useMemo(() => programs.length, [programs]);
  const totalDepartments = useMemo(() => allDepartments.length, [allDepartments]);
  const totalCourses = useMemo(
    () => programs.reduce((sum, program) => sum + (program.courses?.length ?? 0), 0),
    [programs]
  );

  const isLoading = isProgramsLoading || isDepartmentsLoading;
  const isError = isProgramsError || isDepartmentsError;
  const error = programsError ?? departmentsError;

  const closeProgramModal = () => {
    setIsProgramModalOpen(false);
    setEditingProgram(null);
    createDepartmentMutation.reset();
    updateDepartmentMutation.reset();
    createProgramMutation.reset();
    updateProgramMutation.reset();
  };

  const closeDeleteModal = () => {
    setDeletingProgram(null);
    deleteProgramMutation.reset();
  };

  const openCreateProgramModal = () => {
    setEditingProgram(null);
    setIsProgramModalOpen(true);
  };

  const openEditProgramModal = (program: Program) => {
    setEditingProgram(program);
    setIsProgramModalOpen(true);
  };

  const handleRefresh = () => {
    void refetchPrograms();
    void refetchDepartments();
  };

  const submitErrorMessage = 
    createDepartmentMutation.isError ? getApiErrorMessage(createDepartmentMutation.error, 'Failed to create department.') :
    updateDepartmentMutation.isError ? getApiErrorMessage(updateDepartmentMutation.error, 'Failed to update department.') :
    createProgramMutation.isError ? getApiErrorMessage(createProgramMutation.error, 'Failed to create program.') :
    updateProgramMutation.isError ? getApiErrorMessage(updateProgramMutation.error, 'Failed to update program.') :
    undefined;

  const submitValidationMessages = useMemo(() => {
    let errors: Record<string, string[]> | undefined;
    
    const deptError = createDepartmentMutation.error || updateDepartmentMutation.error;
    if (deptError) {
      const deptErrors = getApiValidationErrors(deptError);
      if (Object.keys(deptErrors).length > 0) {
        errors = {
          departmentName: deptErrors.name,
          departmentCode: deptErrors.code,
        };
      }
    } 
    
    const progError = createProgramMutation.error || updateProgramMutation.error;
    if (progError) {
      const progErrors = getApiValidationErrors(progError);
      if (Object.keys(progErrors).length > 0) {
        errors = {
          ...(errors || {}),
          name: progErrors.name,
          code: progErrors.code,
        };
      }
    }
    
    return errors;
  }, [createDepartmentMutation.error, updateDepartmentMutation.error, createProgramMutation.error, updateProgramMutation.error]);

  const handleProgramSubmit = async (data: ProgramFormSubmitValues) => {
    let departmentId = data.departmentId;

    if (data.newDepartment) {
      const createdDepartment = await createDepartmentMutation.mutateAsync({
        name: data.newDepartment.name,
        code: data.newDepartment.code,
      });

      departmentId = createdDepartment.id ?? '';
    }

    if (data.editDepartment && editingProgram?.departmentId) {
      await updateDepartmentMutation.mutateAsync({
        id: editingProgram.departmentId,
        data: {
          name: data.editDepartment.name,
          code: data.editDepartment.code,
        },
      });
    }

    const payload = {
      name: data.name,
      code: data.code,
      departmentId: departmentId ?? '',
    };

    if (!payload.departmentId) {
      throw new Error('Department is required to save the program.');
    }

    if (editingProgram?.id) {
      await updateProgramMutation.mutateAsync({
        id: editingProgram.id,
        data: payload,
      });
      closeProgramModal();
      return;
    }

    await createProgramMutation.mutateAsync(payload);
    closeProgramModal();
  };

  const confirmDeleteProgram = () => {
    if (!deletingProgram?.id) return;

    deleteProgramMutation.mutate(deletingProgram.id, {
      onSuccess: closeDeleteModal,
    });
  };

  if (isError) {
    return (
      <div className="p-6">
        <Card className="rounded-none border border-red-200 bg-red-50 text-red-900">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm">{getApiErrorMessage(error, 'Failed to load programs and departments.')}</p>
            <Button onClick={handleRefresh}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-zinc-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-3">
          <div className="rounded-none bg-zinc-950 p-2.5 text-white shadow-sm">
            <Building2 className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">Programs / Departments</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Demo-ready relational UI for programs, department ownership, and course coverage.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          onClick={openCreateProgramModal}
          className="inline-flex h-10 items-center gap-2 rounded-none bg-zinc-950 font-semibold text-white shadow-sm transition-all hover:bg-zinc-900"
        >
          <Plus className="size-4" />
          Add Program
        </Button>
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="inline-flex h-10 items-center gap-2 rounded-none border-zinc-200 font-semibold text-zinc-950 transition-all hover:bg-zinc-50"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      <div className="mb-8 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Filter by program name"
            className="h-10 rounded-none border-zinc-200 bg-white/50 pl-10 text-sm shadow-none transition-colors hover:bg-zinc-50 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-zinc-300"
          />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total Programs</p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{totalPrograms}</p>
                <p className="mt-2 text-xs text-zinc-500">Programs matching the current query</p>
              </div>
              <div className="rounded-none bg-blue-50 p-2">
                <TrendingUp className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total Departments</p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{totalDepartments}</p>
                <p className="mt-2 text-xs text-zinc-500">Available for selection in the modal</p>
              </div>
              <div className="rounded-none bg-green-50 p-2">
                <Building2 className="size-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-2">
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Course Coverage</p>
            <p className="mt-2 text-sm text-zinc-600">
              The table uses relational data only: department labels come from program.department?.name and course totals come from program.courses?.length.
            </p>
            <div className="mt-3 flex gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-600">{totalCourses} total courses connected</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <DepartmentList
          programs={programs}
          isLoading={isLoading}
          isDeleting={deleteProgramMutation.isPending}
          onCreateProgram={openCreateProgramModal}
          onEditProgram={openEditProgramModal}
          onDeleteProgram={setDeletingProgram}
          onViewProgram={setSelectedProgram}
        />
      </div>

      <DeleteConfirmModal
        open={Boolean(deletingProgram)}
        title="Delete Program"
        description={
          deletingProgram
            ? `This will permanently delete ${deletingProgram.name} from ${deletingProgram.department?.name ?? 'its department'}.`
            : 'This action cannot be undone.'
        }
        confirmLabel="Delete Program"
        isLoading={deleteProgramMutation.isPending}
        errorMessage={deleteProgramMutation.isError ? getApiErrorMessage(deleteProgramMutation.error, 'Failed to delete program.') : undefined}
        onCancel={closeDeleteModal}
        onConfirm={confirmDeleteProgram}
      />

      <Dialog open={isProgramModalOpen} onOpenChange={(open) => (open ? setIsProgramModalOpen(true) : closeProgramModal())}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProgram ? 'Edit Program' : 'Add Program'}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ProgramForm
              key={editingProgram?.id ?? 'new-program'}
              initialData={editingProgram ?? undefined}
              onSubmit={handleProgramSubmit}
              submitErrorMessage={submitErrorMessage}
              submitValidationMessages={submitValidationMessages}
              isLoading={
                createProgramMutation.isPending ||
                updateProgramMutation.isPending ||
                createDepartmentMutation.isPending ||
                updateDepartmentMutation.isPending
              }
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedProgram)} onOpenChange={(open) => !open && setSelectedProgram(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProgram ? `${selectedProgram.name} Details` : 'Program Details'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Program Code</p>
                  <p className="mt-2 text-lg font-bold text-zinc-950">{selectedProgram?.code}</p>
                </CardContent>
              </Card>
              <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Department</p>
                  <p className="mt-2 text-lg font-bold text-zinc-950">{selectedProgram?.department?.name ?? 'Unassigned Department'}</p>
                </CardContent>
              </Card>
              <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Created At</p>
                  <p className="mt-2 text-sm font-bold text-zinc-950">{formatDateTime(selectedProgram?.createdAt)}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden rounded-none border border-zinc-200/80 bg-white/90 shadow-lg shadow-zinc-200/40">
              <CardContent className="p-0">
                <div className="flex flex-col gap-4 border-b border-zinc-200/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">Course Coverage</p>
                    <p className="mt-1 text-sm text-zinc-500">Relational program snapshot using department and courses data.</p>
                  </div>
                  <Button
                    onClick={() => selectedProgram && openEditProgramModal(selectedProgram)}
                    className="inline-flex h-10 items-center gap-2 rounded-none bg-zinc-950 font-semibold text-white shadow-sm transition-all hover:bg-zinc-900"
                  >
                    <Plus className="size-4" />
                    Edit Program
                  </Button>
                </div>

                <div className="divide-y divide-zinc-200/60">
                  <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                      <div className="text-sm font-semibold text-zinc-950">{selectedProgram?.department?.name ?? 'Unassigned Department'}</div>
                      <p className="mt-0.5 text-xs text-zinc-500">Department owner</p>
                    </div>
                    <div className="inline-flex items-center rounded-none bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <CalendarDays className="mr-1.5 size-3.5" />
                      {selectedProgram?.courses?.length ?? 0} Courses
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}