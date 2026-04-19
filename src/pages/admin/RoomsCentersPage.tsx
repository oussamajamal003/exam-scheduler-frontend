import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { getApiErrorMessage } from "../../lib/apiError";
import { Building2, Plus, RefreshCw, TrendingUp } from "lucide-react";

import { RoomList } from "../../features/rooms/RoomList";
import { RoomForm } from "../../forms/rooms/RoomForm";
import { Room } from "../../schemas/room";
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from "../../hooks/rooms/useRooms";

export function RoomsCentersPage() {
  const { data: rooms = [], isLoading, isError, error } = useRooms();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
  const deleteMutation = useDeleteRoom();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreateModal = () => {
    setEditingRoom(null);
    setIsFormOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingRoom(null);
  };

  const handleSubmit = (data: Room) => {
    if (editingRoom?.id) {
      updateMutation.mutate(
        { id: editingRoom.id, data },
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
    if (deletingRoom?.id) {
      deleteMutation.mutate(deletingRoom.id, {
        onSuccess: () => {
          setDeletingRoom(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading facility data..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card className="p-6 space-y-3">
          <p className="text-sm text-red-600">{getApiErrorMessage(error, "Failed to load rooms.")}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-zinc-50/50 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-zinc-950 text-white shadow-sm">
            <Building2 className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Rooms & Centers</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Manage examination facilities and allocate testing spaces</p>
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
          Add Room
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
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Rooms</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{rooms.length}</p>
                <p className="text-xs text-zinc-500 mt-2">Active facilities available</p>
              </div>
              <div className="p-2 rounded-none bg-orange-50">
                <TrendingUp className="size-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Capacity</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{rooms.reduce((sum, r) => sum + (r.capacity || 0), 0)}</p>
                <p className="text-xs text-zinc-500 mt-2">Seating available</p>
              </div>
              <div className="p-2 rounded-none bg-purple-50">
                <Building2 className="size-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-2">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Facility Status</p>
            <p className="text-sm text-zinc-600 mt-2">Manage examination centers and room capacities. Real-time allocation ensures optimal utilization and prevents scheduling conflicts across all testing facilities.</p>
            <div className="flex gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-green-600">All Operational</span>
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
                <p className="mt-2 text-sm">{getApiErrorMessage(createMutation.error, "Failed to create room.")}</p>
              </CardContent>
            </Card>
          )}
          {updateMutation.isError && (
            <Card className="rounded-none border border-red-200 bg-red-50 text-red-900">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold">Update Error</p>
                <p className="mt-2 text-sm">{getApiErrorMessage(updateMutation.error, "Failed to update room.")}</p>
              </CardContent>
            </Card>
          )}
          {deleteMutation.isError && (
            <Card className="rounded-none border border-red-200 bg-red-50 text-red-900">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold">Delete Error</p>
                <p className="mt-2 text-sm">{getApiErrorMessage(deleteMutation.error, "Failed to delete room.")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Rooms List */}
      <div className="mb-8">
        <RoomList
          rooms={rooms}
          isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
          isDeleting={deleteMutation.isPending}
          onEditRoom={openEditModal}
          onDeleteRoom={setDeletingRoom}
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <RoomForm 
              initialData={editingRoom ?? undefined} 
              onSubmit={handleSubmit} 
              isLoading={isSaving} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmModal
        open={!!deletingRoom}
        onCancel={() => setDeletingRoom(null)}
        onConfirm={confirmDelete}
        title="Delete Room"
        description={`Are you sure you want to completely remove ${deletingRoom?.name} at ${deletingRoom?.center}? This could result in scheduling conflicts for active exams.`}
        isLoading={deleteMutation.isPending}
        errorMessage={deleteMutation.isError ? getApiErrorMessage(deleteMutation.error, "Failed to delete room.") : undefined}
      />
    </div>
  );
}
