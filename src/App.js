import { useContext } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Header from "./components/layout/Header";
import MainContent from "./components/layout/MainContent";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import Categories from "./pages/Categories";
import Dashboard from "./pages/Dashboard";
import EditProduct from "./pages/EditProduct";
import GalleryAdmin from "./pages/GalleryAdmin";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Ingredients from "./pages/Ingredients";
import Locations from "./pages/Locations";
import Login from "./pages/Login";
import Order from "./pages/Order";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderList from "./pages/OrderList";
import Products from "./pages/Products";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import TimeslotsAdmin from "./pages/Timeslots";
import PrintAdmin from "./pages/PrintAdmin";
import TicketsAdmin from "./pages/TicketsAdmin";
import Users from "./pages/Users";
import UserOrders from "./pages/UsersOrders";
import VerifyEmail from "./pages/VerifyEmail";
import { ThemeProvider } from "./context/ThemeContext";

const PrivateRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);
  const { tr } = useLanguage();

  if (loading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { token, user, loading } = useContext(AuthContext);
  const { tr } = useLanguage();

  if (loading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!token || user?.role !== "ADMIN") return <Navigate to="/login" replace />;
  return children;
};

const AppLayout = () => (
  <>
    <Header />
    <MainContent>
      <Outlet />
    </MainContent>
  </>
);

function AppRoutes() {
  const { tr } = useLanguage();

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route
          path="/order"
          element={
            <PrivateRoute>
              <Order />
            </PrivateRoute>
          }
        />
        <Route
          path="/order/confirmation"
          element={
            <PrivateRoute>
              <OrderConfirmation />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/userorders"
          element={
            <PrivateRoute>
              <UserOrders />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Dashboard>
                <p className="rounded-xl border border-stone-200 bg-white p-4 text-stone-700">
                  {tr(
                    "Selectionnez une section dans le menu administrateur.",
                    "Select an admin section from the menu."
                  )}
                </p>
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <Dashboard>
                <OrderList />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <Dashboard>
                <Users />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <AdminRoute>
              <Dashboard>
                <Products />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <Dashboard>
                <Products />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/ingredients"
          element={
            <AdminRoute>
              <Dashboard>
                <Ingredients />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <Dashboard>
                <Categories />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/locations"
          element={
            <AdminRoute>
              <Dashboard>
                <Locations />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/timeslots"
          element={
            <AdminRoute>
              <Dashboard>
                <TimeslotsAdmin />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/gallery"
          element={
            <AdminRoute>
              <Dashboard>
                <GalleryAdmin />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/print"
          element={
            <AdminRoute>
              <Dashboard>
                <PrintAdmin />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tickets"
          element={
            <AdminRoute>
              <Dashboard>
                <TicketsAdmin />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/editproduct/:id"
          element={
            <AdminRoute>
              <Dashboard>
                <EditProduct />
              </Dashboard>
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <CartProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </CartProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
