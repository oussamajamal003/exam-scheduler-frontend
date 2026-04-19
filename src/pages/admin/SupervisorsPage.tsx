import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { getApiErrorMessage } from "../../lib/apiError";
import { Users, Plus, RefreshCw, TrendingUp } from "lucide-react";

import { SupervisorList } from "../../features/supervisors/SupervisorList";
import { SupervisorForm } from "../../forms/supervisors/SupervisorForm";
import { Supervisor } from "../../schemas/supervisor";
import { useSupervisors, useCreateSupervisor, useUpdateSupervisor, useDeleteSupervisor } from "../../hooks/supervisors/useSupervisors";

export function SupervisorsPage() {
  const { data: supervisors = [], isLoading, isError, error } = useSupervisors();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [workloadSupervisor, setWorkloadSupervisor] = useState<Supervisor | null>(null);
  const [deletingSupervisor, setDeletingSupervisor] = useState<Supervisor | null>(null);
  
  const createMutation = useCreateSupervisor();
  const updateMutation = useUpdateSupervisor();
  const deleteMutation = useDeleteSupervisor();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreateModal = () => {
    setEditingSupervisor(null);
    setIsFormOpen(true);
  };

  const openEditModal = (supervisor: Supervisor) => {
    setEditingSupervisor(supervisor);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingSupervisor(null);
  };

  const handleSubmit = (data: Supervisor) => {
    if (editingSupervisor?.id) {
      updateMutation.mutate(
        { id: editingSupervisor.id, data },
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
    if (deletingSupervisor?.id) {
      deleteMutation.mutate(deletingSupervisor.id, {
        onSuccess: () => {
          setDeletingSupervisor(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading supervisors..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card className="p-6 space-y-3">
          <p className="text-sm text-red-600">{getApiErrorMessage(error, "Failed to load supervisors.")}</p>
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
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Supervisors</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Manage examination staff and coordinate supervision duties</p>
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
          Add Supervisor
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
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Supervisors</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{supervisors.length}</p>
                <p className="text-xs text-zinc-500 mt-2">Staff members active</p>
              </div>
              <div className="p-2 rounded-none bg-purple-50">
                <TrendingUp className="size-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Workload Status</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">Managed</p>
                <p className="text-xs text-zinc-500 mt-2">Distribution enabled</p>
              </div>
              <div className="p-2 rounded-none bg-orange-50">
                <Users className="size-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-2">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Coordination Status</p>
            <p className="text-sm text-zinc-600 mt-2">Manage examination supervisors and their workloads with precision. Real-time coordination ensures seamless distribution of supervision duties across all scheduled exam sessions and testing facilities.</p>
            <div className="flex gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-green-600">Fully Operational</span>
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
                <p className="mt-2 text-sm">{getApiErrorMessage(createMutation.error, "Failed to create supervisor.")}</p>
              </CardContent>
            </Card>
          )}
          {updateMutation.isError && (
            <Card className="rounded-none border border-red-200 bg-red-50 text-red-900">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold">Update Error</p>
                <p className="mt-2 text-sm">{getApiErrorMessage(updateMutation.error, "Failed to update supervisor.")}</p>
              </CardContent>
            </Card>
          )}
          {deleteMutation.isError && (
            <Card className="rounded-none border border-red-200 bg-red-50 text-red-900">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold">Delete Error</p>
                <p className="mt-2 text-sm">{getApiErrorMessage(deleteMutation.error, "Failed to delete supervisor.")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <SupervisorList
        supervisors={supervisors}
        isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
        isDeleting={deleteMutation.isPending}
        onEditSupervisor={openEditModal}
        onDeleteSupervisor={setDeletingSupervisor}
        onViewWorkload={setWorkloadSupervisor}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSupervisor ? "Edit Supervisor" : "Add New Supervisor"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <SupervisorForm 
              initialData={editingSupervisor ?? undefined} 
              onSubmit={handleSubmit} 
              isLoading={isSaving} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmModal
        open={!!deletingSupervisor}
        onCancel={() => setDeletingSupervisor(null)}
        onConfirm={confirmDelete}
        title="Delete Supervisor"
        description={`Are you sure you want to completely remove ${deletingSupervisor?.name}? This action cannot be undone and may unassign them from their workloads.`}
        isLoading={deleteMutation.isPending}
        errorMessage={deleteMutation.isError ? getApiErrorMessage(deleteMutation.error, "Failed to delete supervisor.") : undefined}
      />

      <Dialog open={!!workloadSupervisor} onOpenChange={(open) => !open && setWorkloadSupervisor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Workload Details</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <Card className="border border-zinc-200 shadow-sm rounded-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
                  <div>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-1">Supervisor</p>
                    <h3 className="text-zinc-950 text-lg font-bold">{workloadSupervisor?.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-1">Assigned Center</p>
                    <p className="text-zinc-900 font-semibold">{workloadSupervisor?.center}</p>
                  </div>
                </div>
                <div className="pt-4 flex flex-col items-center justify-center py-6 gap-2">
                  <div className="size-16 rounded-none bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <span className="text-2xl font-black text-indigo-600">0</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-500">Exams Supervised</p>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setWorkloadSupervisor(null)} className="rounded-none font-semibold shadow-sm">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
