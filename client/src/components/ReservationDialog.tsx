import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  item: {
    id: number;
    name: string;
    description?: string;
    price?: string;
    imageUrl?: string;
  } | null;
}

export function ReservationDialog({ 
  open, 
  onOpenChange, 
  onConfirm,
  item
}: ReservationDialogProps) {
  const [confirmed, setConfirmed] = React.useState(false);
  
  React.useEffect(() => {
    if (!open) {
      setConfirmed(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reservar artículo</DialogTitle>
        </DialogHeader>
        
        {item && (
          <div className="py-2">
            <div className="flex gap-4">
              <div className="w-20 h-20 shrink-0">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium">{item.name}</h4>
                {item.description && (
                  <p className="text-sm text-gray-500">{item.description}</p>
                )}
                {item.price && (
                  <div className="text-primary font-medium mt-1">{item.price} €</div>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p>Al reservar este artículo, te comprometes a:</p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Comprarlo como regalo para el propietario de la lista</li>
                <li>No cancelar la reserva a menos que no puedas comprarlo</li>
              </ul>
              <p className="mt-2">La reserva es privada y solo tú y el propietario de la lista sabrán quién lo ha reservado.</p>
            </div>
            
            <div className="mt-5 flex items-center space-x-2">
              <Checkbox 
                id="confirm-reservation" 
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              />
              <label 
                htmlFor="confirm-reservation" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Confirmo que quiero reservar este artículo
              </label>
            </div>
            
            <DialogFooter className="flex gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={onConfirm}
                disabled={!confirmed}
                className={!confirmed ? "opacity-50 cursor-not-allowed" : ""}
              >
                Reservar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ReservationDialog;
