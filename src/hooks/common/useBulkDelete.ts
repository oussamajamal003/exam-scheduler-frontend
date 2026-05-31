import { useState } from "react";
import { useToast } from "../../components/ui/toast";

type UseBulkDeleteOptions = {
  entityName: string;
  entityNamePlural: string;
  deleteItem: (id: string) => Promise<unknown>;
};

export function useBulkDelete({ entityName, entityNamePlural, deleteItem }: UseBulkDeleteOptions) {
  const { addToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAll = <T extends { id?: string }>(rows: T[], checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      rows.forEach((row) => {
        if (!row.id) return;
        if (checked) next.add(row.id);
        else next.delete(row.id);
      });
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const confirmDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsDeleting(true);
    const results = await Promise.allSettled(ids.map((id) => deleteItem(id)));
    const deletedIds = ids.filter((_, index) => results[index].status === "fulfilled");
    const failedCount = results.length - deletedIds.length;

    setSelectedIds((current) => {
      const next = new Set(current);
      deletedIds.forEach((id) => next.delete(id));
      return next;
    });
    setIsDeleting(false);

    if (failedCount === 0) {
      setIsConfirmOpen(false);
      addToast({
        type: "success",
        title: `${entityNamePlural} deleted`,
        description: `${deletedIds.length} selected ${deletedIds.length === 1 ? entityName : entityNamePlural} removed.`,
      });
      return;
    }

    addToast({
      type: "error",
      title: "Bulk delete incomplete",
      description: `${deletedIds.length} deleted, ${failedCount} failed. Review the remaining selected rows and try again.`,
    });
  };

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isConfirmOpen,
    isDeleting,
    setIsConfirmOpen,
    toggleSelected,
    toggleAll,
    clearSelection,
    confirmDelete,
  };
}
