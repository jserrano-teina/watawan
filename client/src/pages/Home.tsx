import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchWishlists, createWishlist, updateWishlist, deleteWishlist } from "@/lib/api";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import WishlistCard from "@/components/WishlistCard";
import CreateListDialog from "@/components/CreateListDialog";
import ShareDialog from "@/components/ShareDialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("my-lists");
  const [createListOpen, setCreateListOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWishlist, setSelectedWishlist] = useState<any>(null);
  
  // Fetch wishlists
  const { data: wishlists, isLoading } = useQuery({
    queryKey: ['/api/wishlists'],
    queryFn: fetchWishlists
  });
  
  // Create wishlist mutation
  const createWishlistMutation = useMutation({
    mutationFn: createWishlist,
    onSuccess: () => {
      setCreateListOpen(false);
      toast({
        title: "Lista creada",
        description: "Tu lista de deseos ha sido creada correctamente"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la lista de deseos",
        variant: "destructive"
      });
      console.error(error);
    }
  });
  
  // Update wishlist mutation
  const updateWishlistMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateWishlist(id, data),
    onSuccess: () => {
      setCreateListOpen(false);
      toast({
        title: "Lista actualizada",
        description: "Tu lista de deseos ha sido actualizada correctamente"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la lista de deseos",
        variant: "destructive"
      });
      console.error(error);
    }
  });
  
  // Delete wishlist mutation
  const deleteWishlistMutation = useMutation({
    mutationFn: deleteWishlist,
    onSuccess: () => {
      setDeleteDialogOpen(false);
      toast({
        title: "Lista eliminada",
        description: "La lista de deseos ha sido eliminada correctamente"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la lista de deseos",
        variant: "destructive"
      });
      console.error(error);
    }
  });
  
  // Handlers
  const handleCreateList = (data: any) => {
    if (selectedWishlist) {
      updateWishlistMutation.mutate({ id: selectedWishlist.id, data });
    } else {
      createWishlistMutation.mutate(data);
    }
  };
  
  const handleEditList = (id: number) => {
    const wishlist = wishlists?.find(w => w.id === id);
    if (wishlist) {
      setSelectedWishlist(wishlist);
      setCreateListOpen(true);
    }
  };
  
  const handleOpenCreateList = () => {
    setSelectedWishlist(null);
    setCreateListOpen(true);
  };
  
  const handleShareList = (id: number) => {
    const wishlist = wishlists?.find(w => w.id === id);
    if (wishlist) {
      setSelectedWishlist(wishlist);
      setShareDialogOpen(true);
    }
  };
  
  const handleDeleteList = (id: number) => {
    const wishlist = wishlists?.find(w => w.id === id);
    if (wishlist) {
      setSelectedWishlist(wishlist);
      setDeleteDialogOpen(true);
    }
  };
  
  const confirmDeleteList = () => {
    if (selectedWishlist) {
      deleteWishlistMutation.mutate(selectedWishlist.id);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen relative">
      <Header title="WishLink" />
      
      <main className="flex-1 px-4 max-w-screen-sm mx-auto w-full pb-20">
        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 mt-2 bg-white">
          <button 
            className={`px-4 py-2 font-medium ${
              activeTab === "my-lists" 
                ? "text-primary border-b-2 border-primary" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("my-lists")}
          >
            Mis listas
          </button>
          <button 
            className={`px-4 py-2 font-medium ${
              activeTab === "shared-with-me" 
                ? "text-primary border-b-2 border-primary" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("shared-with-me")}
          >
            Compartidas conmigo
          </button>
        </div>
        
        {/* Content area */}
        <div className="py-4">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-500">Cargando tus listas...</p>
            </div>
          )}
          
          {/* Empty state for My Lists */}
          {!isLoading && wishlists && wishlists.length === 0 && activeTab === "my-lists" && (
            <div className="py-8 text-center">
              <div className="rounded-full bg-gray-100 w-16 h-16 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" x2="2" y1="8" y2="22"/><line x1="17.5" x2="9" y1="15" y2="15"/></svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-800">No tienes listas de deseos</h3>
              <p className="mt-2 text-gray-500">Crea tu primera lista de deseos para comenzar</p>
              <button 
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg font-medium"
                onClick={handleOpenCreateList}
              >
                Crear lista
              </button>
            </div>
          )}
          
          {/* Empty state for Shared With Me */}
          {!isLoading && activeTab === "shared-with-me" && (
            <div className="py-8 text-center">
              <div className="rounded-full bg-gray-100 w-16 h-16 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-800">No hay listas compartidas contigo</h3>
              <p className="mt-2 text-gray-500">Las listas que otros compartan contigo aparecerán aquí</p>
            </div>
          )}
          
          {/* Lists container */}
          {!isLoading && wishlists && wishlists.length > 0 && activeTab === "my-lists" && (
            <div>
              {wishlists.map((wishlist) => (
                <WishlistCard 
                  key={wishlist.id} 
                  wishlist={wishlist}
                  onEdit={handleEditList}
                  onShare={handleShareList}
                  onDelete={handleDeleteList}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <BottomNavigation onCreateClick={handleOpenCreateList} />
      
      {/* Create/Edit List Dialog */}
      <CreateListDialog 
        open={createListOpen} 
        onOpenChange={setCreateListOpen} 
        onSubmit={handleCreateList}
        editList={selectedWishlist}
      />
      
      {/* Share Dialog */}
      {selectedWishlist && (
        <ShareDialog 
          open={shareDialogOpen} 
          onOpenChange={setShareDialogOpen} 
          shareableId={selectedWishlist.shareableId}
          wishlistName={selectedWishlist.name}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la lista de deseos "{selectedWishlist?.name}" y todos sus artículos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteList}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
