import { useContext } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import EditPizza from "./pages/EditPizza";
import Header from "./pages/Header";
import Ingredients from "./pages/Ingredients";
import Login from "./pages/Login";
import MainContent from "./pages/MainContent";
import Menu from "./pages/Menu";
import Order from "./pages/Order";
import OrderList from "./pages/OrderList";
import Pizzas from "./pages/Pizzas";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import TimeslotsAdmin from "./pages/Timeslots";
import Users from "./pages/Users";
import UserOrders from "./pages/UsersOrders";

const PrivateRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { token, user, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>;
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
  return (
    <Routes>

      <Route element={<AppLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="menu" element={<Menu />} />

        <Route
          path="order"
          element={
            <PrivateRoute>
              <Order />
            </PrivateRoute>
          }
        />
        <Route
          path="profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="userorders"
          element={
            <PrivateRoute>
              <UserOrders />
            </PrivateRoute>
          }
        />

        <Route
          path="admin"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="admin/pizzas"
          element={
            <AdminRoute>
              <Dashboard>
                <Pizzas />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="admin/ingredients"
          element={
            <AdminRoute>
              <Dashboard>
                <Ingredients />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <AdminRoute>
              <Dashboard>
                <Users />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="admin/editpizza/:id"
          element={
            <AdminRoute>
              <Dashboard>
                <EditPizza />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="admin/timeslots"
          element={
            <AdminRoute>
              <Dashboard>
                <TimeslotsAdmin />
              </Dashboard>
            </AdminRoute>
          }
        />
        <Route
          path="admin/orders"
          element={
            <AdminRoute>
              <Dashboard>
                <OrderList />
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
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}