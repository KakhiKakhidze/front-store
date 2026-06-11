import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import ItemForm from "./pages/ItemForm";
import Receiving from "./pages/Receiving";
import GRNForm from "./pages/GRNForm";
import Issuance from "./pages/Issuance";
import SRFForm from "./pages/SRFForm";
import PurchaseReqs from "./pages/PurchaseReqs";
import PRForm from "./pages/PRForm";
import PurchaseOrders from "./pages/PurchaseOrders";
import POForm from "./pages/POForm";
import Reports from "./pages/Reports";
import Suppliers from "./pages/Suppliers";
import SupplierForm from "./pages/SupplierForm";
import StockTake from "./pages/StockTake";
import StockTakeDetail from "./pages/StockTakeDetail";
import Tenders from "./pages/Tenders";
import TenderForm from "./pages/TenderForm";
import TenderDetail from "./pages/TenderDetail";
import TenderPortal from "./pages/TenderPortal";
import SpecialOffers from "./pages/SpecialOffers";
import MyOffers from "./pages/MyOffers";
import MyProducts from "./pages/MyProducts";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function RoleProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.includes(user.role)) return children;
  
  // Default redirection if unauthorized
  if (user.role === 'Supplier') return <Navigate to="/tender-portal" replace />;
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route index element={
                  <RoleProtectedRoute allowedRoles={['GM', 'Storekeeper', 'PurchasingOfficer', 'FinanceController', 'DeptHead']}>
                    <Dashboard />
                  </RoleProtectedRoute>
                } />
                <Route path="inventory" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'Storekeeper', 'PurchasingOfficer']}>
                    <Inventory />
                  </RoleProtectedRoute>
                } />
                <Route path="inventory/new" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'Storekeeper', 'PurchasingOfficer']}>
                    <ItemForm />
                  </RoleProtectedRoute>
                } />
                <Route path="inventory/:id/edit" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'Storekeeper', 'PurchasingOfficer']}>
                    <ItemForm />
                  </RoleProtectedRoute>
                } />
                <Route path="receiving" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'Storekeeper']}>
                    <Receiving />
                  </RoleProtectedRoute>
                } />
                <Route path="receiving/new" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'Storekeeper']}>
                    <GRNForm />
                  </RoleProtectedRoute>
                } />
                <Route path="issuance" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'Storekeeper', 'DeptHead']}>
                    <Issuance />
                  </RoleProtectedRoute>
                } />
                <Route path="issuance/new" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'Storekeeper', 'DeptHead']}>
                    <SRFForm />
                  </RoleProtectedRoute>
                } />
                <Route path="purchasing" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'PurchasingOfficer', 'DeptHead']}>
                    <PurchaseReqs />
                  </RoleProtectedRoute>
                } />
                <Route path="purchasing/new" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'PurchasingOfficer', 'DeptHead']}>
                    <PRForm />
                  </RoleProtectedRoute>
                } />
                <Route path="po" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'PurchasingOfficer', 'FinanceController']}>
                    <PurchaseOrders />
                  </RoleProtectedRoute>
                } />
                <Route path="po/new" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'PurchasingOfficer']}>
                    <POForm />
                  </RoleProtectedRoute>
                } />
                <Route path="reports" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'FinanceController']}>
                    <Reports />
                  </RoleProtectedRoute>
                } />
                <Route path="suppliers" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'PurchasingOfficer']}>
                    <Suppliers />
                  </RoleProtectedRoute>
                } />
                <Route path="suppliers/new" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'PurchasingOfficer']}>
                    <SupplierForm />
                  </RoleProtectedRoute>
                } />
                <Route path="suppliers/:id/edit" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'PurchasingOfficer']}>
                    <SupplierForm />
                  </RoleProtectedRoute>
                } />
                <Route path="stocktake" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'Storekeeper']}>
                    <StockTake />
                  </RoleProtectedRoute>
                } />
                <Route path="stocktake/:id" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'Storekeeper']}>
                    <StockTakeDetail />
                  </RoleProtectedRoute>
                } />
                <Route path="tender" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'PurchasingOfficer', 'FinanceController']}>
                    <Tenders />
                  </RoleProtectedRoute>
                } />
                <Route path="tender/new" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'PurchasingOfficer']}>
                    <TenderForm />
                  </RoleProtectedRoute>
                } />
                <Route path="tender/:id" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'PurchasingOfficer', 'FinanceController']}>
                    <TenderDetail />
                  </RoleProtectedRoute>
                } />
                <Route path="tender/:id/edit" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'PurchasingOfficer']}>
                    <TenderForm />
                  </RoleProtectedRoute>
                } />
                <Route path="tender-portal" element={
                  <RoleProtectedRoute allowedRoles={['Supplier']}>
                    <TenderPortal />
                  </RoleProtectedRoute>
                } />
                <Route path="special-offers" element={
                  <RoleProtectedRoute allowedRoles={['GM', 'PurchasingOfficer']}>
                    <SpecialOffers />
                  </RoleProtectedRoute>
                } />
                <Route path="my-offers" element={
                  <RoleProtectedRoute allowedRoles={['Supplier']}>
                    <MyOffers />
                  </RoleProtectedRoute>
                } />
                <Route path="my-products" element={
                  <RoleProtectedRoute allowedRoles={['Supplier']}>
                    <MyProducts />
                  </RoleProtectedRoute>
                } />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
