import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UseMutationResult } from "@tanstack/react-query";
import { WishItem } from "@/types";

interface ReceivedConfirmationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: WishItem | null;
  markAsReceivedMutation: UseMutationResult<WishItem, Error, number>;
}

export function ReceivedConfirmationSheet({
  isOpen,
  onClose,
  item,
  markAsReceivedMutation,
}: ReceivedConfirmationSheetProps) {
  const handleConfirm = () => {
    if (item) {
      markAsReceivedMutation.mutate(item.id, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  if (!item) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="max-h-screen overflow-y-auto pb-10">
        <SheetHeader className="text-left">
          <SheetTitle>¿Ya recibiste este regalo?</SheetTitle>
          <SheetDescription>
            Al confirmar, este regalo se marcará como recibido y desaparecerá de tu lista de deseos.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-lg font-medium">{item.title}</p>
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
          </div>

          <div className="mt-4 flex flex-col space-y-2">
            <Button 
              onClick={handleConfirm} 
              variant="default"
              disabled={markAsReceivedMutation.isPending}
            >
              {markAsReceivedMutation.isPending ? "Confirmando..." : "Sí, ya lo recibí"}
            </Button>
            <Button 
              onClick={onClose} 
              variant="outline"
              disabled={markAsReceivedMutation.isPending}
            >
              No, aún no
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}