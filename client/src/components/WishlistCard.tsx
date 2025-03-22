import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface WishlistCardProps {
  wishlist: {
    id: number;
    name: string;
    isPublic: boolean;
    updatedAt: Date;
    items: any[];
    itemCount: number;
  };
  onEdit: (id: number) => void;
  onShare: (id: number) => void;
  onDelete: (id: number) => void;
}

export function WishlistCard({ wishlist, onEdit, onShare, onDelete }: WishlistCardProps) {
  const [, setLocation] = useLocation();

  const handleViewList = () => {
    setLocation(`/wishlists/${wishlist.id}`);
  };

  const formattedDate = formatDistanceToNow(new Date(wishlist.updatedAt), { 
    addSuffix: true,
    locale: es
  });

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-4 border border-gray-100">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg">{wishlist.name}</h3>
          <div className="flex space-x-1">
            <button 
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
              onClick={() => onEdit(wishlist.id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button 
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
              onClick={() => onShare(wishlist.id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
            <button 
              className="p-1 text-gray-500 hover:text-error rounded"
              onClick={() => onDelete(wishlist.id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        
        <div className="flex items-center mt-1 text-sm text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          <span>{wishlist.itemCount} items · Actualizado {formattedDate}</span>
        </div>
        
        <div className="mt-3 grid grid-cols-3 gap-2">
          {wishlist.items.map((item, index) => (
            <div key={index} className="bg-gray-100 aspect-square rounded-lg overflow-hidden relative">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="object-cover w-full h-full" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
            </div>
          ))}
          {wishlist.itemCount > 3 && (
            <div className="bg-gray-100 aspect-square rounded-lg overflow-hidden relative flex items-center justify-center">
              <span className="text-gray-500 font-medium">+{wishlist.itemCount - 3}</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-1 items-center">
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
              {wishlist.isPublic ? "Público" : "Privado"}
            </span>
          </div>
          <button 
            className="text-primary font-medium flex items-center"
            onClick={handleViewList}
          >
            Ver lista 
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default WishlistCard;
