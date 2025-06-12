import { Route, Switch } from 'wouter';
import MobileHomePage from './pages/MobileHomePage';
import MobileAuthPage from './pages/MobileAuthPage';
import MobileWishlistPage from './pages/MobileWishlistPage';
import AddItemPage from './pages/AddItemPage';

export default function App() {
  return (
    <div className="mobile-app">
      <Switch>
        <Route path="/" component={MobileHomePage} />
        <Route path="/auth" component={MobileAuthPage} />
        <Route path="/wishlist" component={MobileWishlistPage} />
        <Route path="/add-item" component={AddItemPage} />
        <Route>
          <div className="mobile-404">
            <h1>Página no encontrada</h1>
          </div>
        </Route>
      </Switch>
    </div>
  );
}