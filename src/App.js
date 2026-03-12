import { Suspense, lazy, useContext } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";
import Header from "./components/layout/Header";
import MainContent from "./components/layout/MainContent";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { slugifyCity } from "./seo/localLandingContent";

const Categories = lazy(() => import("./pages/Categories"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EditProduct = lazy(() => import("./pages/EditProduct"));
const GalleryAdmin = lazy(() => import("./pages/GalleryAdmin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Home = lazy(() => import("./pages/Home"));
const Menu = lazy(() => import("./pages/Menu"));
const TourneeCamion = lazy(() => import("./pages/planing"));
const APropos = lazy(() => import("./pages/APropos"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const LocalSeoPage = lazy(() => import("./pages/LocalSeoPage"));
const CitySeoPage = lazy(() => import("./pages/CitySeoPage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Ingredients = lazy(() => import("./pages/Ingredients"));
const Locations = lazy(() => import("./pages/Locations"));
const Login = lazy(() => import("./pages/Login"));
const Order = lazy(() => import("./pages/Order"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const OrderList = lazy(() => import("./pages/OrderList"));
const Products = lazy(() => import("./pages/Products"));
const Profile = lazy(() => import("./pages/Profile"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TimeslotsAdmin = lazy(() => import("./pages/Timeslots"));
const PrintAdmin = lazy(() => import("./pages/PrintAdmin"));
const TicketsAdmin = lazy(() => import("./pages/TicketsAdmin"));
const Users = lazy(() => import("./pages/Users"));
const UserOrders = lazy(() => import("./pages/UsersOrders"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

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

const LegacyPizzaCityRoute = () => {
  const { city } = useParams();
  const slug = slugifyCity(city);
  if (!slug) {
    return <NotFound />;
  }
  return <Navigate to={`/pizza-${slug}`} replace />;
};

function AppRoutes() {
  const { tr } = useLanguage();
  const loadingFallback = (
    <p className="section-shell py-8 text-sm text-stone-400">
      {tr("Chargement...", "Loading...")}
    </p>
  );

  return (
    <Suspense fallback={loadingFallback}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/planing" element={<TourneeCamion />} />
          <Route path="/tournee-camion" element={<Navigate to="/planing" replace />} />
          <Route path="/tournee" element={<Navigate to="/planing" replace />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogArticle />} />
          <Route path="/pizza-napolitaine-thionville" element={<LocalSeoPage cityKey="thionville" />} />
          <Route path="/pizza-napolitaine-metz" element={<LocalSeoPage cityKey="metz" />} />
          <Route path="/food-truck-pizza-moselle" element={<LocalSeoPage cityKey="moselle" />} />
          <Route path="/pizza/:city" element={<LegacyPizzaCityRoute />} />
          <Route path="/pizza-:city" element={<CitySeoPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
