import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { orderApi, voucherApi, userApi } from '../services/api.js';
import '../styles/Checkout.css';

const Checkout = () => {
    const navigate = useNavigate();
    const { cartItems, setCartItems } = useCart();
    const { user } = useAuth();

    // ==========================================
    // 1. GOM TOÀN BỘ USESTATE LÊN ĐẦU TIÊN
    // ==========================================
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bannedMethods, setBannedMethods] = useState([]);
    const [availableVouchers, setAvailableVouchers] = useState([]);
    
    const [voucherCode, setVoucherCode]   = useState('');
    const [discount, setDiscount]         = useState(0);
    const [voucherError, setVoucherError] = useState('');
    const [voucherOk, setVoucherOk]       = useState(false);

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [shippingFee, setShippingFee] = useState(0);
    // STATE CHO TÍNH NĂNG ĐỊA CHỈ ĐÃ LƯU
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [isUsingSavedAddress, setIsUsingSavedAddress] = useState(false);
    const [selectedSavedAddress, setSelectedSavedAddress] = useState('');

    const [addressData, setAddressData] = useState({
        province: '',
        district: '',
        ward: '',
        street: ''
    });

    const [formData, setFormData] = useState({
        customerName:    '',
        phoneNumber:     '',
        note:            '',
        paymentMethod:   'COD',
    });

    // ==========================================
    // 2. KHAI BÁO BIẾN TÍNH TOÁN TIỀN (1 LẦN DUY NHẤT)
    // ==========================================
    const subtotal   = cartItems ? cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0) : 0;
    const finalTotal = subtotal + shippingFee - discount;

    // ==========================================
    // 3. CÁC HÀM USEEFFECT (TẢI DỮ LIỆU KHI MỞ TRANG)
    // ==========================================
    useEffect(() => {
        if (!localStorage.getItem('token')) {
            alert('Vui lòng đăng nhập để tiếp tục thanh toán.');
            navigate('/login', { state: { from: '/checkout' } });
            return;
        }

        const fetchInitialData = async () => {
            // Lấy danh sách cấm thanh toán
            if (user?.id) {
                try {
                    const codRes = await userApi.checkRestriction(user.id, "COD");
                    const bankRes = await userApi.checkRestriction(user.id, "BANK"); 
                    const bans = [];
                    if (codRes.data?.isRestricted) bans.push("COD");
                    if (bankRes.data?.isRestricted) bans.push("BANK");
                    setBannedMethods(bans);
                } catch (error) { console.error("Lỗi kiểm tra cấm:", error); }
            }

            // Lấy danh sách Voucher
            try {
                const res = await voucherApi.getAll(); 
                const valid = res.data.filter(v => v.isActive && new Date(v.expiryDate) > new Date());
                setAvailableVouchers(valid);
            } catch (error) { console.error("Lỗi tải voucher:", error); }

            // Lấy Tỉnh/Thành phố
            try {
                const provRes = await fetch('https://provinces.open-api.vn/api/p/');
                const provData = await provRes.json();
                setProvinces(provData);
            } catch (error) { console.error("Lỗi API tỉnh thành:", error); }
            try {
                const addrRes = await orderApi.getSavedAddresses();
                setSavedAddresses(addrRes.data || []);
            } catch (error) { 
                console.error("Lỗi tải danh sách địa chỉ cũ:", error); 
            }
        };

        fetchInitialData();
    }, [user, navigate]);

    // ==========================================
    // 4. CÁC HÀM XỬ LÝ SỰ KIỆN (ĐỊA CHỈ & FORM)
    // ==========================================
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleProvinceChange = async (e) => {
        const provinceCode = e.target.value;
        const provinceName = e.target.options[e.target.selectedIndex].text;
        
        setAddressData(prev => ({ ...prev, province: provinceName, district: '', ward: '' }));
        setShippingFee(0); setDistricts([]); setWards([]);

        if (provinceCode) {
            const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
            const data = await res.json();
            setDistricts(data.districts);
        }
    };

    const handleDistrictChange = async (e) => {
        const districtCode = e.target.value;
        const districtName = e.target.options[e.target.selectedIndex].text;
        
        setAddressData(prev => ({ ...prev, district: districtName, ward: '' }));

        if (districtCode) {
            const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
            const data = await res.json();
            setWards(data.wards);

            // Thuật toán tính phí ship
            let fee = 0;
            const prov = addressData.province;
            const isUrban = districtName.includes("Quận");

            if (prov.includes("Hà Nội")) {
                fee = isUrban ? 21000 : 29000;
            } else if (prov.includes("Hồ Chí Minh")) {
                fee = isUrban ? 29000 : 39000;
            } else {
                fee = isUrban ? 29000 : 34000;
            }
            setShippingFee(fee);
        }
    };

    const handleWardChange = (e) => {
        const wardName = e.target.options[e.target.selectedIndex].text;
        setAddressData(prev => ({ ...prev, ward: wardName }));
    };

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) { setVoucherError('Vui lòng nhập mã giảm giá'); return; }
        setVoucherError(''); setVoucherOk(false);
        try {
            const payload = {
                code: voucherCode,
                orderTotal: subtotal,
                paymentMethod: formData.paymentMethod,
                userId: user?.id ? parseInt(user.id) : null 
            };
            const res = await voucherApi.check(payload); 
            setDiscount(res.data.discountValue); 
            setVoucherOk(true);
        } catch (err) {
            setVoucherError(err.response?.data?.message || 'Mã không hợp lệ hoặc đã hết hạn');
            setDiscount(0);
        }
    };
   const handleSelectSavedAddress = (e) => {
        const index = e.target.value;
        if (index === "") {
            setIsUsingSavedAddress(false);
            setSelectedSavedAddress('');
            setAddressData({ province: '', district: '', ward: '', street: '' }); // Reset trắng
            setShippingFee(0);
            return;
        }

        const addr = savedAddresses[index];
        setIsUsingSavedAddress(true);
        setSelectedSavedAddress(addr.shippingAddress);
        
        // Tự động điền Họ tên, SĐT
        setFormData(prev => ({
            ...prev,
            customerName: addr.customerName || '',
            phoneNumber: addr.phoneNumber || ''
        }));

        // 🟢 ĐIỀN THẲNG ĐỊA CHỈ CŨ VÀO Ô INPUT ĐỂ KHÁCH CÓ THỂ TỰ SỬA
        setAddressData(prev => ({
            ...prev,
            street: addr.shippingAddress
        }));

        // Phí ship mặc định khi dùng địa chỉ cũ
        setShippingFee(29000); 
    };
    // ==========================================
    // 5. NÚT ĐẶT HÀNG (CHỐT ĐƠN)
    // ==========================================
   const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cartItems || cartItems.length === 0) { alert('Giỏ hàng đang trống!'); return; }
    
    // Kiểm tra đủ các field địa chỉ
    // Kiểm tra thông tin cơ bản
    if (!formData.customerName || !formData.phoneNumber) {
        alert('Vui lòng điền đầy đủ họ tên và số điện thoại!'); 
        return;
    }

    // Kiểm tra địa chỉ: Phụ thuộc vào việc có dùng địa chỉ cũ hay không
    const isAddressValid = isUsingSavedAddress 
        ? addressData.street.trim() !== '' // Dùng địa chỉ cũ thì chỉ cần ô Street có chữ
        : (addressData.province && addressData.district && addressData.ward && addressData.street.trim() !== ''); // Nhập mới thì phải đủ 4 ô

    if (!isAddressValid) {
        alert('Vui lòng cung cấp đầy đủ thông tin địa chỉ giao hàng!');
        return;
    }

   // 🟢 NẾU DÙNG ĐỊA CHỈ CŨ THÌ LẤY LUÔN GIÁ TRỊ TRONG Ô STREET (Vì khách có thể vừa sửa trên đó)
    const fullShippingAddress = isUsingSavedAddress 
        ? addressData.street 
        : `${addressData.street}, ${addressData.ward}, ${addressData.district}, ${addressData.province}`;

    const payload = {
        userId:          user?.id ? parseInt(user.id) : null,
        orderDate:       new Date().toISOString(),
        totalAmount:     finalTotal,
        status:          'Pending',
        shippingAddress: fullShippingAddress, // Dùng biến vừa gộp
        customerName:    formData.customerName,
        phoneNumber:     formData.phoneNumber,
        paymentMethod:   formData.paymentMethod,
        note:            formData.note,
        voucherCode:     discount > 0 ? voucherCode : null,
        shippingFee:     shippingFee,
        items: cartItems.map(i => ({ 
            productId: parseInt(i.originalId || i.id), 
            quantity: i.quantity,
            variantName: i.selectedVolume || "Mặc định" 
        })),
    };
        
        setIsSubmitting(true);
        try {
            await orderApi.create(payload);
            const u = JSON.parse(localStorage.getItem('user'));
            localStorage.removeItem(u ? `cart_${u.id}` : 'cart_guest');
            setCartItems([]);
            alert('Đặt hàng thành công! Cảm ơn bạn đã tin tưởng.');
            navigate('/');
        } catch (err) {
            alert('Lỗi: ' + (err.response?.data?.message || 'Không thể đặt hàng'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const paymentOptions = [
        { value: 'COD', icon: 'fas fa-money-bill-wave', iconBg: '#e6f4ea', iconColor: '#1e8e3e', label: 'Thanh toán khi nhận hàng', desc: 'Trả tiền mặt khi nhận được hàng (COD)', details: null },
        { value: 'BANK', icon: 'fas fa-university', iconBg: '#e8f0fe', iconColor: '#1a73e8', label: 'Chuyển khoản ngân hàng', desc: 'Chuyển khoản qua tài khoản ngân hàng', details: (
            <div className="payment-guide">
                <div className="bank-alert"><strong>Lưu ý:</strong> Chuyển khoản với nội dung <b>[Số điện thoại] + [Tên]</b></div>
                <p>Ngân hàng: <strong>Vietcombank</strong></p>
                <p>Số tài khoản: <strong className="text-success">0123456789</strong></p>
                <p>Chủ tài khoản: <strong>CONG TY MY PHAM THUAN CHAY</strong></p>
            </div>
        )},
        { value: 'MOMO', icon: 'fas fa-wallet', iconBg: '#fce4ec', iconColor: '#d82d8b', label: 'Ví điện tử MoMo', desc: 'Thanh toán tự động qua ứng dụng MoMo', details: (
            <div className="payment-guide text-center">
                <p className="small text-muted mb-2">Mở ứng dụng MoMo để quét mã QR</p>
                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="MoMo QR" style={{width: '100px', opacity: 0.8}} />
                <p className="mt-2 mb-0 font-weight-bold" style={{color: '#d82d8b'}}>Hotline: 0912 345 678</p>
            </div>
        )},
        { value: 'VNPAY', icon: 'fas fa-qrcode', iconBg: '#e0f2fe', iconColor: '#0284c7', label: 'Cổng thanh toán VNPAY', desc: 'Quét mã qua App Ngân hàng hoặc thẻ ATM', details: (
            <div className="payment-guide">
                <p className="small text-muted mb-0"><i className="fas fa-info-circle"></i> Hệ thống sẽ tự động chuyển hướng bạn sang cổng VNPAY an toàn sau khi bấm Đặt hàng.</p>
            </div>
        )}
    ];

    return (
        <div className="ck-page" style={{ backgroundColor: '#fdfbfb', paddingBottom: '60px' }}>
            
            <div className="ck-hero">
                <div className="ck-hero-inner text-center">
                    <div className="ck-breadcrumb mb-2">
                        <Link to="/">Trang chủ</Link>
                        <i className="fa fa-chevron-right mx-2" style={{ fontSize: 9 }}></i>
                        <Link to="/cart">Giỏ hàng</Link>
                        <i className="fa fa-chevron-right mx-2" style={{ fontSize: 9 }}></i>
                        <span>Thanh toán</span>
                    </div>
                    <h1>Thanh Toán Đơn Hàng</h1>
                </div>
            </div>

            <div className="ck-steps mt-4 mb-5">
                <div className="ck-step done"><div className="ck-step-dot"><i className="fa fa-check" style={{ fontSize: 10 }}></i></div><span className="ck-step-label">Giỏ hàng</span></div>
                <div className="ck-step active"><div className="ck-step-dot">2</div><span className="ck-step-label">Thanh toán</span></div>
                <div className="ck-step"><div className="ck-step-dot">3</div><span className="ck-step-label">Hoàn tất</span></div>
            </div>

            <div className="container">
                <form onSubmit={handlePlaceOrder}>
                    <div className="row">
                        <div className="col-lg-7 mb-4">
                            <div className="ck-card shadow-sm mb-4">
                                <div className="ck-card-head">
                                    <i className="fa fa-map-marker-alt"></i><h2>Thông tin giao hàng</h2>
                                </div>
                               <div className="ck-card-body">
                                    
                                    {/* 🟢 SỔ ĐỊA CHỈ NHÌN SANG TRỌNG HƠN */}
                                    {savedAddresses.length > 0 && (
                                        <div className="mb-4">
                                            <label className="font-weight-bold" style={{ color: '#0d4a3b', fontSize: '14px' }}>
                                                <i className="fas fa-book mr-2"></i> Sổ địa chỉ của bạn
                                            </label>
                                            <select className="form-control" onChange={handleSelectSavedAddress} style={{ border: '1px solid #0d4a3b', backgroundColor: '#f4fbf7', color: '#0d4a3b', fontWeight: '500', cursor: 'pointer' }}>
                                                <option value="">+ Nhập địa chỉ mới</option>
                                                {savedAddresses.map((addr, idx) => (
                                                    <option key={idx} value={idx}>
                                                        {addr.customerName} - {addr.phoneNumber} - {addr.shippingAddress}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="row">
                                        <div className="col-md-6 ck-field mb-3">
                                            <label>Họ và tên <span className="text-danger">*</span></label>
                                            <input type="text" name="customerName" className="form-control" placeholder="Nguyễn Văn A" value={formData.customerName} onChange={handleChange} required />
                                        </div>
                                        <div className="col-md-6 ck-field mb-3">
                                            <label>Số điện thoại <span className="text-danger">*</span></label>
                                            <input type="text" name="phoneNumber" className="form-control" placeholder="0912 345 678" value={formData.phoneNumber} onChange={handleChange} required />
                                        </div>
                                    </div>

                                    {/* 🟢 PHẦN ĐỊA CHỈ THÔNG MINH */}
                                    <div className="ck-field mb-3">
                                        <label>Địa chỉ nhận hàng <span className="text-danger">*</span></label>
                                        
                                        {/* Chỉ hiện 3 ô Tỉnh/Huyện/Xã nếu KHÔNG dùng địa chỉ cũ */}
                                        {!isUsingSavedAddress && (
                                            <div className="row mt-2 mb-2">
                                                <div className="col-md-4 mb-2">
                                                    <select className="form-control" onChange={handleProvinceChange} required={!isUsingSavedAddress}>
                                                        <option value="">Chọn Tỉnh / TP</option>
                                                        {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-md-4 mb-2">
                                                    <select className="form-control" onChange={handleDistrictChange} disabled={!districts.length} required={!isUsingSavedAddress}>
                                                        <option value="">Chọn Quận / Huyện</option>
                                                        {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-md-4 mb-2">
                                                    <select className="form-control" onChange={handleWardChange} disabled={!wards.length} required={!isUsingSavedAddress}>
                                                        <option value="">Chọn Phường / Xã</option>
                                                        {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {/* Ô nhập hiển thị linh hoạt */}
                                        <input 
                                            type="text" 
                                            className="form-control mt-2" 
                                            placeholder={isUsingSavedAddress ? "Địa chỉ chi tiết..." : "Số nhà, tên đường, ngõ ngách..."} 
                                            value={addressData.street} 
                                            onChange={(e) => setAddressData(prev => ({ ...prev, street: e.target.value }))} 
                                            required 
                                        />
                                        
                                        {isUsingSavedAddress && (
                                            <small className="text-muted mt-2 d-block">
                                                <i className="fas fa-pen mr-1"></i> Bạn có thể bấm vào ô trên để sửa lại địa chỉ nếu muốn.
                                            </small>
                                        )}
                                    </div>
                                   

                                    <div className="ck-field mb-0">
                                        <label>Ghi chú đơn hàng</label>
                                        <textarea name="note" rows="3" className="form-control" placeholder="Ghi chú cho người giao hàng..." value={formData.note} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="ck-card shadow-sm">
                                <div className="ck-card-head">
                                    <i className="fa fa-shopping-bag"></i><h2>Sản phẩm đặt mua ({cartItems?.length || 0})</h2>
                                </div>
                                <div className="ck-card-body">
                                    {!cartItems || cartItems.length === 0 ? (
                                        <p style={{ textAlign: 'center', color: '#999', padding: '20px 0', margin: 0 }}>Giỏ hàng trống. <Link to="/products" style={{ fontWeight: 'bold' }}>Mua sắm ngay</Link></p>
                                    ) : (
                                        <div className="ck-items">
                                            {cartItems.map(item => (
                                                <div key={item.id} className="ck-item d-flex align-items-center mb-3 pb-3 border-bottom">
                                                    <img src={item.imageUrl || '/images/prod-1.jpg'} alt={item.name} className="ck-item-img mr-3 rounded border" style={{ width: '60px', height: '60px', objectFit: 'cover' }} onError={(e) => { e.target.src = '/images/prod-1.jpg'; }} />
                                                    <div className="flex-grow-1">
                                                        <div className="ck-item-name font-weight-bold text-dark">{item.name}</div>
                                                        <div className="ck-item-qty text-muted small">Số lượng: {item.quantity}</div>
                                                    </div>
                                                    <div className="ck-item-price font-weight-bold">{(item.price * item.quantity).toLocaleString('vi-VN')} đ</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-5">
                            <div className="ck-card shadow-sm mb-4">
                                <div className="ck-card-head">
                                    <i className="fa fa-ticket-alt"></i><h2>Mã giảm giá</h2>
                                </div>
                                <div className="ck-card-body">
                                    <div className="d-flex">
                                        <input type="text" className="form-control custom-input-border" placeholder="NHẬP MÃ GIẢM GIÁ..." value={voucherCode} onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(''); setVoucherOk(false); }} />
                                        <button type="button" className="btn btn-apply-voucher font-weight-bold" onClick={handleApplyVoucher}>Áp dụng</button>
                                    </div>
                                    {voucherOk && <div className="text-success mt-2 font-weight-bold small"><i className="fa fa-check-circle mr-1"></i> Áp dụng thành công! Được giảm {discount.toLocaleString('vi-VN')} đ</div>}
                                    {voucherError && <div className="text-danger mt-2 font-weight-bold small">{voucherError}</div>}

                                    {availableVouchers && availableVouchers.length > 0 && (
                                        <div className="mt-4 pt-3 border-top">
                                            <h6 className="font-weight-bold mb-3" style={{ color: '#555', fontSize: '0.95rem' }}><i className="fa fa-gift mr-2"></i>Mã giảm giá dành cho bạn:</h6>
                                            <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '5px' }}>
                                                {availableVouchers.map(v => {
                                                    const isEligible = subtotal >= v.minOrderAmount;
                                                    return (
                                                        <div key={v.id} className={`d-flex justify-content-between align-items-center p-3 mb-2 border rounded ${isEligible ? 'bg-white shadow-sm' : 'bg-light'}`} style={{ opacity: isEligible ? 1 : 0.6 }}>
                                                            <div>
                                                                <div className="font-weight-bold mb-1" style={{ fontSize: '1.1rem' }}>{v.code}</div>
                                                                <div className="small text-muted mb-1">Giảm mạnh <strong>{v.discountAmount?.toLocaleString('vi-VN')}đ</strong></div>
                                                                <div className="small text-muted" style={{ fontSize: '0.8rem' }}>Đơn tối thiểu: {v.minOrderAmount?.toLocaleString('vi-VN')}đ</div>
                                                            </div>
                                                            <div>
                                                                <button type="button" className={`btn btn-sm font-weight-bold ${isEligible ? 'btn-outline-dark' : 'btn-secondary'}`} disabled={!isEligible} onClick={() => { setVoucherCode(v.code); setVoucherError(''); alert(`Đã nhập mã ${v.code}. Vui lòng bấm nút "Áp dụng"!`); }}>
                                                                    {isEligible ? 'Dùng ngay' : 'Chưa đủ ĐK'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="ck-card shadow-sm mb-4">
                                <div className="ck-card-head">
                                    <i className="fa fa-receipt"></i><h2>Tóm tắt đơn hàng</h2>
                                </div>
                                <div className="ck-card-body">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Tạm tính</span>
                                        <span className="font-weight-bold">{subtotal.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Phí vận chuyển</span>
                                        {shippingFee === 0 ? (
                                            <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '13px' }}>(Chọn địa chỉ để tính phí)</span>
                                        ) : (
                                            <span className="font-weight-bold">+{shippingFee.toLocaleString('vi-VN')} đ</span>
                                        )}
                                    </div>
                                    {discount > 0 && (
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Giảm giá ({voucherCode})</span>
                                            <span className="text-danger font-weight-bold">−{discount.toLocaleString('vi-VN')} đ</span>
                                        </div>
                                    )}
                                    <hr />
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="font-weight-bold" style={{ fontSize: '1.1rem' }}>Tổng thanh toán</span>
                                        <span className="font-weight-bold" style={{ fontSize: '1.6rem', color: '#880e4f' }}>{finalTotal.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                </div>
                            </div>

                            <div className="ck-card shadow-sm">
                                <div className="ck-card-head">
                                    <i className="fa fa-credit-card"></i><h2>Phương thức thanh toán</h2>
                                </div>
                                <div className="ck-card-body p-3">
                                    <div className="payment-methods-list">
                                        {paymentOptions.map(opt => {
                                            const isBanned = bannedMethods.includes(opt.value);
                                            const isSelected = formData.paymentMethod === opt.value;
                                            return (
                                                <div key={opt.value} className={`payment-method-wrapper ${isSelected ? 'selected' : ''} ${isBanned ? 'banned' : ''}`}>
                                                    <div className="payment-method-header" onClick={() => {
                                                            if (isBanned) { alert(`Bạn đang bị cấm sử dụng ${opt.label} do hủy đơn quá nhiều!`); return; }
                                                            setFormData(f => ({ ...f, paymentMethod: opt.value }));
                                                            if (discount > 0 && formData.paymentMethod !== opt.value) {
                                                                setDiscount(0); setVoucherOk(false); setVoucherError('Bạn vừa đổi phương thức. Vui lòng áp dụng lại mã!');
                                                            }
                                                        }}>
                                                        <div className="payment-custom-radio"><div className="radio-dot"></div></div>
                                                        <div className="payment-icon-box" style={{ background: opt.iconBg, color: opt.iconColor }}><i className={opt.icon}></i></div>
                                                        <div className="payment-text-box">
                                                            <div className="payment-title">{opt.label}</div>
                                                            <div className="payment-desc">{opt.desc}</div>
                                                            {isBanned && <div className="payment-banned-text"><i className="fa fa-lock"></i> Đang bị tạm khóa</div>}
                                                        </div>
                                                    </div>
                                                    <div className="payment-method-details" style={{ maxHeight: isSelected && opt.details ? '200px' : '0' }}>
                                                        <div className="payment-details-inner">{opt.details}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button type="submit" className="btn btn-block btn-final-checkout mt-4 shadow-sm" disabled={isSubmitting || !cartItems || cartItems.length === 0}>
                                        {isSubmitting ? <><div className="spinner-border spinner-border-sm mr-2"></div> Đang xử lý...</> : <><i className="fa fa-check-circle mr-2"></i> ĐẶT HÀNG NGAY</>}
                                    </button>
                                    <div className="text-center mt-3 text-muted small"><i className="fa fa-shield-alt mr-1"></i> Thông tin của bạn được mã hóa an toàn</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Checkout;