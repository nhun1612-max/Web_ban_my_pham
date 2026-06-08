import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

// Pages Admin
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Users from './pages/Users';

// Pages Liquor Store (Khách hàng)
import LiquorHome from './pages/LiquorHome';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* --- ROUTES CÔNG KHAI CHO NGƯỜI MUA --- */}
                    <Route path="/" element={<LiquorHome />} />
                    <Route path="/cart" element={<Cart />} />

                    {/* Checkout yêu cầu đăng nhập (bất kể là Admin hay Khách) */}
                    <Route
                        path="/checkout"
                        element={
                            <ProtectedRoute>
                                <Checkout />
                            </ProtectedRoute>
                        }
                    />

                    {/* --- ROUTE ĐĂNG NHẬP --- */}
                    <Route path="/login" element={<Login />} />

                    {/* --- ROUTES CHO ADMIN (Yêu cầu đăng nhập và userType === 1) --- */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute requiredType={1}>
                                <MainLayout>
                                    <Dashboard />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/products"
                        element={
                            <ProtectedRoute requiredType={1}>
                                <MainLayout>
                                    <Products />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/categories"
                        element={
                            <ProtectedRoute requiredType={1}>
                                <MainLayout>
                                    <Categories />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/users"
                        element={
                            <ProtectedRoute requiredType={1}>
                                <MainLayout>
                                    <Users />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />

                    {/* --- ĐIỀU HƯỚNG MẶC ĐỊNH --- */}
                    {/* Nếu gõ sai đường dẫn, tự động quay về trang chủ người mua */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;