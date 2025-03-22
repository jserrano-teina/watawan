import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import WishlistDetail from "@/pages/WishlistDetail";
import SharedWishlist from "@/pages/SharedWishlist";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/wishlists/:id" component={WishlistDetail} />
      <Route path="/shared/:shareableId" component={SharedWishlist} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
