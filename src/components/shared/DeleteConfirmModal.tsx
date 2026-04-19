import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  open: boolean;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  open,
  title = "Delete Record",
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isLoading = false,
  errorMessage,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Deleting..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
