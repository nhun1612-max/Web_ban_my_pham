import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { useCart } from '../contexts/CartContext';
import { voucherApi } from '../services/api';
import '../styles/Cart.css';

const Cart = () => {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, updateQuantity } = useCart();

    const [couponCode, setCouponCode]       = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [couponError, setCouponError]     = useState('');
    const [couponOk, setCouponOk]           = useState(false);
    const [applying, setApplying]           = useState(false);
    
    // 🟢 THÊM STATE ĐỂ LƯU GỢI Ý MUA THÊM
    const [suggestions, setSuggestions]     = useState([]);

    const subtotal = cartItems.reduce((t, i) => t + i.price * i.quantity, 0);
    const total    = subtotal - discountAmount;

    // 🟢 GỌI API THUẬT TOÁN GỢI Ý MỖI KHI GIỎ HÀNG THAY ĐỔI
    useEffect(() => {
        if (!cartItems || cartItems.length === 0) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            try {
                const payload = {
                    cartTotal: subtotal,
                    items: cartItems.map(item => ({ productId: item.id, quantity: item.quantity }))
                };

                // Gọi API lấy gợi ý
                const res = await voucherApi.getSmartSuggestions(payload);
                setSuggestions(res.data || []);
            } catch (error) {
                console.error("Lỗi lấy gợi ý:", error);
            }
        };

        fetchSuggestions();
    }, [cartItems, subtotal]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) { setCouponError('Vui lòng nhập mã giảm giá!'); return; }
        setCouponError(''); setCouponOk(false); setApplying(true);
        try {
            const res = await voucherApi.check(couponCode, subtotal);
            setDiscountAmount(res.data.discountAmount);
            setCouponOk(true);
        } catch (err) {
            setCouponError(err.response?.data?.message || 'Mã không hợp lệ hoặc đã hết hạn');
            setDiscountAmount(0);
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="cart-page">

            {/* HERO */}
            <div className="ck-hero" style={{ backgroundColor: '#266b5a', borderBottom: '1px solid #266b5a', padding: '40px 0' }}>
                <div className="ck-hero-inner text-center">
                    <div className="ck-breadcrumb mb-2" style={{ fontSize: '0.9rem' }}>
                        <Link to="/" style={{ color: '#d7eeed' }}>Trang chủ</Link>
                        <i className="fa fa-chevron-right mx-2" style={{ fontSize: 9, color: '#999' }}></i>
                        <span className="text-muted">Giỏ hàng</span>
                    </div>
                    <h1 style={{ color: '#266b5a', fontFamily: '"Playfair Display", serif', fontWeight: 'bold' }}>Giỏ Hàng Của Bạn</h1>
                </div>
            </div>

            {cartItems.length === 0 ? (
                /* TRỐNG */
                <div className="cart-empty text-center py-5">
                    <i className="fa fa-shopping-cart fa-3x mb-3" style={{ color: '#084838', opacity: 0.5 }}></i>
                    <h3 className="text-muted">Giỏ hàng của bạn đang trống</h3>
                    {/* 🟢 ĐÃ SỬA THÀNH MỸ PHẨM */}
                    <p style={{ fontSize: 15, marginBottom: 24, color: '#666' }}>Hãy khám phá các sản phẩm mỹ phẩm chính hãng của chúng tôi</p>
                    <Link to="/products" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '12px 28px', background: '#084838', color: '#fff',
                        borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none',
                        boxShadow: '0 4px 6px rgba(216, 27, 96, 0.2)'
                    }}>
                        <i className="fa fa-arrow-left"></i> Tiếp tục mua sắm
                    </Link>
                </div>
            ) : (
                <div className="cart-body">

                    {/* ── CỘT TRÁI — Bảng sản phẩm ── */}
                    <div style={{ flex: '1 1 auto' }}>
                        
                        {/* 🟢 KHU VỰC HIỂN THỊ GỢI Ý MUA THÊM (UP-SELLING) */}
                        {suggestions.length > 0 && (
                            <div className="suggestions-container" style={{ marginBottom: '20px' }}>
                                {suggestions.map((sug, idx) => (
                                    <div key={idx} className="d-flex align-items-center mb-2 p-3 shadow-sm" 
                                         style={{ borderLeft: '4px solid #ff9800', backgroundColor: '#fff8e1', borderRadius: '8px' }}>
                                        <i className="fa fa-fire text-danger" style={{ fontSize: '1.5rem', marginRight: '15px' }}></i>
                                        <div style={{ flex: 1 }}>
                                            <h6 className="mb-1" style={{ color: '#d84315', fontWeight: 700, margin: 0 }}>{sug.title}</h6>
                                            <p className="mb-0 text-dark" style={{ fontSize: '0.9rem', margin: 0 }}>{sug.shortMessage}</p>
                                        </div>
                                        {/* Nút bấm để khách hành động ngay */}
                                        {sug.type === 'SPEND_MORE' && (
                                            <button className="btn btn-sm" 
                                                    style={{ backgroundColor: '#084838', color: '#fff', marginLeft: '15px', whiteSpace: 'nowrap', borderRadius: '6px' }}
                                                    onClick={() => navigate('/products')}>
                                                Mua tiếp
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="ck-card shadow-sm" style={{ marginBottom: 0, borderRadius: '12px', overflow: 'hidden' }}>
                            <div className="ck-card-head" style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee' }}>
                                <i className="fa fa-shopping-bag" style={{ color: '#d81b60' }}></i>
                                <h2>Sản phẩm ({cartItems.length})</h2>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="cart-table">
                                    <thead>
                                        <tr style={{ backgroundColor: '#fcfcfc' }}>
                                            <th style={{ width: 80 }}>Ảnh</th>
                                            <th>Sản phẩm</th>
                                            <th className="right">Đơn giá</th>
                                            <th className="center">Số lượng</th>
                                            <th className="right">Thành tiền</th>
                                            <th style={{ width: 45 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cartItems.map(item => (
                                            <tr key={item.id}>
                                                <td data-label="Ảnh">
                                                    <img
                                                        src={item.imageUrl || '/images/prod-1.jpg'}
                                                        alt={item.name}
                                                        className="cart-img"
                                                        style={{ borderRadius: '8px', border: '1px solid #eee' }}
                                                        onError={(e) => { e.target.src = '/images/prod-1.jpg'; }}
                                                    />
                                                </td>
                                                <td data-label="Sản phẩm">
                                                    <div className="cart-name font-weight-bold text-dark">{item.name}</div>
                                                    {/* 🟢 ĐÃ SỬA THÀNH MỸ PHẨM */}
                                                    <div className="cart-name-sub text-muted small">{item.description || 'Mỹ phẩm cao cấp'}</div>
                                                </td>
                                                <td className="right" data-label="Đơn giá">
                                                    <span className="cart-price font-weight-bold" style={{ color: '#d81b60' }}>
                                                        {item.price?.toLocaleString('vi-VN')} đ
                                                    </span>
                                                </td>
                                                <td className="center" data-label="Số lượng">
                                                    <div className="cart-qty-wrap" style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '2px' }}>
                                                        <button
                                                            className="cart-qty-btn"
                                                            type="button"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        >−</button>
                                                        <span className="cart-qty-val font-weight-bold">{item.quantity}</span>
                                                        <button
                                                            className="cart-qty-btn"
                                                            type="button"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        >+</button>
                                                    </div>
                                                </td>
                                                <td className="right" data-label="Thành tiền">
                                                    <span className="cart-total-cell font-weight-bold">
                                                        {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="cart-remove text-danger"
                                                        type="button"
                                                        title="Xóa sản phẩm"
                                                        onClick={() => removeFromCart(item.id)}
                                                        style={{ background: 'none', border: 'none', fontSize: '1.2rem' }}
                                                    >
                                                        <i className="fa fa-trash-alt"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tiếp tục mua */}
                            <div style={{ padding: '16px 24px', borderTop: '1px solid #eee', backgroundColor: '#fcfcfc' }}>
                                <Link to="/products" className="cart-continue text-decoration-none" style={{ color: '#d81b60', fontWeight: 'bold' }}>
                                    <i className="fa fa-arrow-left mr-2"></i> Tiếp tục mua sắm
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ── CỘT PHẢI ── */}
                    <div className="cart-sidebar">

                        {/* Voucher */}
                        <div className="ck-card shadow-sm" style={{ borderRadius: '12px' }}>
                            <div className="ck-card-head" style={{ borderBottom: '1px solid #eee' }}>
                                <i className="fa fa-tag" style={{ color: '#d81b60' }}></i>
                                <h2>Mã giảm giá</h2>
                            </div>
                            <div className="ck-card-body">
                                <div className="ck-voucher d-flex">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Nhập mã..."
                                        value={couponCode}
                                        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, border: '1px solid #ddd' }}
                                        onChange={(e) => {
                                            setCouponCode(e.target.value.toUpperCase());
                                            setCouponError(''); setCouponOk(false);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="btn"
                                        style={{ backgroundColor: '#d81b60', color: '#fff', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                        onClick={handleApplyCoupon}
                                        disabled={applying}
                                    >
                                        {applying ? '...' : 'Áp dụng'}
                                    </button>
                                </div>
                                {couponOk && (
                                    <div className="ck-voucher-success text-success mt-2 small font-weight-bold">
                                        <i className="fa fa-check-circle mr-1"></i>
                                        Giảm {discountAmount.toLocaleString('vi-VN')} đ
                                    </div>
                                )}
                                {couponError && <div className="ck-voucher-error text-danger mt-2 small font-weight-bold">{couponError}</div>}
                            </div>
                        </div>

                        {/* Tổng tiền */}
                        <div className="ck-card shadow-sm mt-4" style={{ borderRadius: '12px' }}>
                            <div className="ck-card-head" style={{ borderBottom: '1px solid #eee' }}>
                                <i className="fa fa-calculator" style={{ color: '#d81b60' }}></i>
                                <h2>Tổng đơn hàng</h2>
                            </div>
                            <div className="ck-card-body">
                                <div className="ck-summary-row d-flex justify-content-between mb-2">
                                    <span className="text-muted">Tạm tính</span>
                                    <span className="font-weight-bold">{subtotal.toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div className="ck-summary-row d-flex justify-content-between mb-2">
                                    <span className="text-muted">Phí vận chuyển</span>
                                    <span className="badge badge-success px-2 py-1">Miễn phí</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="ck-summary-row d-flex justify-content-between mb-2">
                                        <span className="text-muted">Giảm giá</span>
                                        <span className="text-danger font-weight-bold">−{discountAmount.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                )}
                                <hr />
                                <div className="ck-summary-row total d-flex justify-content-between mb-4">
                                    <span className="font-weight-bold" style={{ fontSize: '1.1rem' }}>Tổng cộng</span>
                                    <span className="font-weight-bold" style={{ fontSize: '1.3rem', color: '#d81b60' }}>{total.toLocaleString('vi-VN')} đ</span>
                                </div>

                                <Link
                                    to="/checkout"
                                    state={{ discountAmount }}
                                    className="btn btn-block font-weight-bold py-2 shadow-sm"
                                    style={{ backgroundColor: '#d81b60', color: '#fff', borderRadius: '8px' }}
                                >
                                    <i className="fa fa-lock mr-2"></i>
                                    Tiến hành thanh toán
                                </Link>

                                <div className="ck-secure-note text-center mt-3 text-muted small">
                                    <i className="fa fa-shield-alt mr-1 text-success"></i>
                                    Thanh toán an toàn & bảo mật 100%
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;