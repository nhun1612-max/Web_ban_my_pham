import React, { useState, useEffect } from 'react';
import { voucherApi } from '../services/api';
import '../styles/Vouchers.css';

const EMPTY_FORM = {
    code: '', name: '', description: '',
    discountType: 2, discountAmount: 0, maxDiscountAmount: '',
    minOrderAmount: 0, applyTarget: 1, targetIds: '',
    startDate: '', expiryDate: '',
    usageLimit: '', usageLimitPerUser: 1, isActive: true,
    allowedPaymentMethod: 'ALL',
};

/* ── Badge loại giảm ── */
const TypeBadge = ({ type, amount }) => {
    if (type === 1) return <span className="badge badge-type-pct">Giảm {amount}%</span>;
    if (type === 2) return <span className="badge badge-type-fixed">−{Number(amount).toLocaleString('vi-VN')}đ</span>;
    return <span className="badge badge-type-ship">Freeship</span>;
};

/* ── Badge trạng thái ── */
const StatusBadge = ({ active }) => (
    <span className={`badge ${active ? 'badge-active' : 'badge-inactive'}`}>
        {active
            ? <><i className="fa fa-circle mr-1" style={{ fontSize: 7 }}></i>Đang bật</>
            : <><i className="fa fa-circle mr-1" style={{ fontSize: 7 }}></i>Đã khóa</>}
    </span>
);

/* ── Tên đối tượng áp dụng ── */
const targetLabel = (t) => ['', 'Toàn sàn', 'Sản phẩm cụ thể', 'Danh mục', 'Khách VIP', 'Khách cá nhân'][t] || '—';

const Vouchers = () => {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData]   = useState(EMPTY_FORM);
    const [keyword, setKeyword]     = useState('');

    useEffect(() => { loadVouchers(); }, []);

    const loadVouchers = async () => {
        setLoading(true);
        try {
            const res = await voucherApi.getAll();
            const list = res.data?.items || res.data || res;
            setVouchers(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error('Lỗi tải danh sách:', e);
            setVouchers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setFormData({ ...EMPTY_FORM, startDate: new Date().toISOString().slice(0, 16) });
        setEditingId(null);
        setShowModal(true);
    };

    const handleEdit = (v) => {
        setFormData({
            code: v.code, name: v.name || '', description: v.description || '',
            discountType: v.discountType, discountAmount: v.discountAmount,
            maxDiscountAmount: v.maxDiscountAmount || '',
            minOrderAmount: v.minOrderAmount,
            applyTarget: v.applyTarget, targetIds: v.targetIds || '',
            startDate: v.startDate ? v.startDate.slice(0, 16) : '',
            expiryDate: v.expiryDate ? v.expiryDate.slice(0, 16) : '',
            usageLimit: v.usageLimit || '',
            usageLimitPerUser: v.usageLimitPerUser,
            isActive: v.isActive,
            allowedPaymentMethod: v.allowedPaymentMethod || 'ALL',
        });
        setEditingId(v.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
        try { await voucherApi.delete(id); loadVouchers(); }
        catch { alert('Lỗi khi xóa!'); }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleVipChange = (e) => {
        const val = e.target.value;
        let tiers = formData.targetIds ? formData.targetIds.split(',').filter(Boolean) : [];
        if (e.target.checked) tiers.push(val);
        else tiers = tiers.filter(t => t !== val);
        setFormData(f => ({ ...f, targetIds: tiers.join(',') }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            discountType:       Number(formData.discountType),
            discountAmount:     Number(formData.discountAmount),
            maxDiscountAmount:  formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
            minOrderAmount:     Number(formData.minOrderAmount),
            applyTarget:        Number(formData.applyTarget),
            usageLimit:         formData.usageLimit ? Number(formData.usageLimit) : null,
            usageLimitPerUser:  Number(formData.usageLimitPerUser),
        };
        try {
            if (editingId) await voucherApi.update(editingId, payload);
            else           await voucherApi.create(payload);
            setShowModal(false);
            loadVouchers();
        } catch (err) {
            console.error('LỖI BACKEND:', err.response);
            const s = err.response?.status;
            const msg = err.response?.data?.message
                || (err.response?.data?.errors && 'LỖI DỮ LIỆU: ' + JSON.stringify(err.response.data.errors))
                || (s === 401 && 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!')
                || (s === 404 && 'Không tìm thấy API — kiểm tra lại api.js')
                || (s === 500 && 'Lỗi Server (500) — kiểm tra Visual Studio')
                || 'Có lỗi xảy ra khi lưu!';
            alert(msg);
        }
    };

    /* Lọc local theo keyword */
    const filtered = vouchers.filter(v =>
        !keyword ||
        v.code?.toLowerCase().includes(keyword.toLowerCase()) ||
        v.name?.toLowerCase().includes(keyword.toLowerCase())
    );

    const isExpired = (date) => date && new Date(date) < new Date();

    return (
        <>
            {/* ── PAGE HEADER ── */}
            <div className="content-header">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">
                        <h1 className="m-0 font-weight-bold" style={{ fontSize: 22, fontFamily: 'Inter,sans-serif' }}>
                            <i className="fa fa-tag mr-2" style={{ color: '#8B1A1A' }}></i>
                            Quản lý Mã giảm giá
                        </h1>
                        <ol className="breadcrumb mb-0" style={{ fontSize: 12 }}>
                            <li className="breadcrumb-item">Admin</li>
                            <li className="breadcrumb-item active">Voucher</li>
                        </ol>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="vouchers-page">
                        <div className="card shadow-sm">

                            {/* HEADER */}
                            <div className="card-header">
                                <div className="row align-items-center">
                                    <div className="col-md-4">
                                        <h3 className="card-title font-weight-bold m-0" style={{ fontSize: 14 }}>
                                            Danh sách Voucher
                                            <span className="badge badge-light border ml-2" style={{ fontSize: 12 }}>
                                                {filtered.length}
                                            </span>
                                        </h3>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="input-group input-group-sm">
                                            <div className="input-group-prepend">
                                                <span className="input-group-text bg-white border-right-0">
                                                    <i className="fa fa-search text-muted"></i>
                                                </span>
                                            </div>
                                            <input
                                                type="text"
                                                className="form-control border-left-0"
                                                placeholder="Tìm mã hoặc tên chương trình..."
                                                value={keyword}
                                                onChange={e => setKeyword(e.target.value)}
                                                style={{ borderRadius: '0 8px 8px 0' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4 text-right">
                                        <button className="btn btn-sm btn-add px-3" onClick={handleAddNew}>
                                            <i className="fa fa-plus mr-1"></i> Thêm mã mới
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* TABLE */}
                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border" style={{ color: '#8B1A1A' }}></div>
                                        <p className="mt-2 text-muted" style={{ fontSize: 13 }}>Đang tải...</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover table-bordered mb-0">
                                            <thead className="thead-dark">
                                                <tr>
                                                    <th className="text-center" style={{ width: 50 }}>STT</th>
                                                    <th style={{ minWidth: 130 }}>Mã Code</th>
                                                    <th style={{ minWidth: 160 }}>Tên chương trình</th>
                                                    <th className="text-center" style={{ minWidth: 150 }}>Loại giảm</th>
                                                    <th className="text-right" style={{ width: 130 }}>Đơn tối thiểu</th>
                                                    <th className="text-center" style={{ width: 120 }}>Áp dụng cho</th>
                                                    <th className="text-center" style={{ width: 120 }}>Hạn dùng</th>
                                                    <th className="text-center" style={{ width: 100 }}>Trạng thái</th>
                                                    <th className="text-center" style={{ width: 100 }}>Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filtered.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} className="text-center py-5 text-muted">
                                                            <i className="fa fa-tag fa-3x d-block mb-3" style={{ opacity: 0.15 }}></i>
                                                            Không có mã giảm giá nào
                                                        </td>
                                                    </tr>
                                                ) : filtered.map((v, i) => (
                                                    <tr key={v.id} style={{ opacity: isExpired(v.expiryDate) && v.isActive ? 0.6 : 1 }}>
                                                        <td className="text-center text-muted" style={{ fontSize: 12 }}>{i + 1}</td>
                                                        <td>
                                                            <span className="code-tag">{v.code}</span>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{v.name}</div>
                                                            {v.description && (
                                                                <div className="text-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                                                                    {v.description}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="text-center">
                                                            <TypeBadge type={v.discountType} amount={v.discountAmount} />
                                                            {v.discountType === 1 && v.maxDiscountAmount > 0 && (
                                                                <div className="text-muted" style={{ fontSize: 11, marginTop: 3 }}>
                                                                    tối đa {Number(v.maxDiscountAmount).toLocaleString('vi-VN')}đ
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="text-right" style={{ fontSize: 13 }}>
                                                            {Number(v.minOrderAmount).toLocaleString('vi-VN')}đ
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="badge badge-light border" style={{ fontSize: 11 }}>
                                                                {targetLabel(v.applyTarget)}
                                                            </span>
                                                        </td>
                                                        <td className="text-center" style={{ fontSize: 12 }}>
                                                            {v.expiryDate ? (
                                                                <span className={isExpired(v.expiryDate) ? 'text-danger' : 'text-muted'}>
                                                                    {isExpired(v.expiryDate) && (
                                                                        <i className="fa fa-exclamation-circle mr-1" style={{ fontSize: 10 }}></i>
                                                                    )}
                                                                    {new Date(v.expiryDate).toLocaleDateString('vi-VN')}
                                                                </span>
                                                            ) : '—'}
                                                        </td>
                                                        <td className="text-center">
                                                            <StatusBadge active={v.isActive} />
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-sm btn-outline-info mr-1"
                                                                title="Chỉnh sửa"
                                                                onClick={() => handleEdit(v)}
                                                            >
                                                                <i className="fa fa-edit"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                title="Xóa"
                                                                onClick={() => handleDelete(v.id)}
                                                            >
                                                                <i className="fa fa-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {!loading && filtered.length > 0 && (
                                <div className="card-footer text-muted">
                                    Tổng cộng <strong>{filtered.length}</strong> mã giảm giá
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                MODAL THÊM / SỬA
            ══════════════════════════════════════ */}
            {showModal && (
                <div className="vouchers-modal">
                    <div
                        className="modal fade show"
                        style={{ display: 'block' }}
                        onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
                    >
                        <div className="modal-dialog modal-lg modal-dialog-scrollable">
                            <form className="modal-content" onSubmit={handleSubmit}>

                                <div className="modal-header text-white">
                                    <h5 className="modal-title">
                                        <i className={`fas ${editingId ? 'fa-edit' : 'fa-plus-circle'} mr-2`}></i>
                                        {editingId ? 'Chỉnh sửa mã giảm giá' : 'Thêm mã giảm giá mới'}
                                    </h5>
                                    <button type="button" className="close text-white" onClick={() => setShowModal(false)}>
                                        <span>&times;</span>
                                    </button>
                                </div>

                                <div className="modal-body" style={{ padding: '20px 24px' }}>

                                    {/* ── SECTION 1: THÔNG TIN CHUNG ── */}
                                    <div className="section-head">
                                        <i className="fa fa-info-circle"></i> 1. Thông tin chung
                                    </div>
                                    <div className="row">
                                        <div className="col-md-5 mb-3">
                                            <label>Mã Code <span className="text-danger">*</span></label>
                                            <input
                                                type="text" className="form-control" name="code"
                                                placeholder="VD: TETGIA30"
                                                value={formData.code}
                                                onChange={e => setFormData(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                                required
                                                style={{ fontFamily: 'Courier New, monospace', letterSpacing: 2, fontWeight: 700 }}
                                            />
                                            <div className="hint">Nhập in hoa, không dấu, không khoảng trắng</div>
                                        </div>
                                        <div className="col-md-7 mb-3">
                                            <label>Tên chương trình <span className="text-danger">*</span></label>
                                            <input
                                                type="text" className="form-control" name="name"
                                                placeholder="VD: Khuyến mãi Tết 2025"
                                                value={formData.name} onChange={handleChange} required
                                            />
                                        </div>
                                        <div className="col-12 mb-3">
                                            <label>Mô tả ngắn</label>
                                            <input
                                                type="text" className="form-control" name="description"
                                                placeholder="Mô tả hiển thị cho khách hàng..."
                                                value={formData.description} onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    {/* ── SECTION 2: THIẾT LẬP GIẢM GIÁ ── */}
                                    <div className="section-head">
                                        <i className="fa fa-percent"></i> 2. Thiết lập giảm giá
                                    </div>
                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label>Loại giảm giá</label>
                                            <select className="form-control" name="discountType" value={formData.discountType} onChange={handleChange}>
                                                <option value="1">Giảm theo % (phần trăm)</option>
                                                <option value="2">Giảm số tiền cố định (VNĐ)</option>
                                                <option value="3">Miễn phí vận chuyển (Freeship)</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label>
                                                Mức giảm{' '}
                                                <span className="text-muted font-weight-normal">
                                                    ({formData.discountType == 1 ? '%' : 'VNĐ'})
                                                </span>
                                                <span className="text-danger"> *</span>
                                            </label>
                                            <input
                                                type="number" className="form-control" name="discountAmount"
                                                value={formData.discountAmount} onChange={handleChange}
                                                required min="0"
                                            />
                                        </div>
                                        {formData.discountType == 1 && (
                                            <div className="col-md-4 mb-3">
                                                <label>Giảm tối đa (VNĐ)</label>
                                                <input
                                                    type="number" className="form-control" name="maxDiscountAmount"
                                                    placeholder="Không giới hạn"
                                                    value={formData.maxDiscountAmount} onChange={handleChange} min="0"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* ── SECTION 3: ĐIỀU KIỆN ── */}
                                    <div className="section-head">
                                        <i className="fa fa-sliders-h"></i> 3. Điều kiện sử dụng
                                    </div>
                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label>Đơn tối thiểu (VNĐ) <span className="text-danger">*</span></label>
                                            <input
                                                type="number" className="form-control" name="minOrderAmount"
                                                value={formData.minOrderAmount} onChange={handleChange}
                                                required min="0"
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label>Hình thức thanh toán</label>
                                            <select className="form-control" name="allowedPaymentMethod" value={formData.allowedPaymentMethod} onChange={handleChange}>
                                                <option value="ALL">Tất cả hình thức</option>
                                                <option value="COD">COD (thu hộ khi nhận)</option>
                                                <option value="VNPAY">Chuyển khoản / VNPay</option>
                                                <option value="MOMO">Ví điện tử MoMo</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label>Áp dụng cho</label>
                                            <select className="form-control" name="applyTarget" value={formData.applyTarget} onChange={handleChange}>
                                                <option value="1">Toàn sàn</option>
                                                <option value="2">Sản phẩm cụ thể</option>
                                                <option value="3">Danh mục cụ thể</option>
                                                <option value="4">Khách hàng VIP</option>
                                                <option value="5">Khách hàng cá nhân</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Target: Sản phẩm / Danh mục */}
                                    {(formData.applyTarget == 2 || formData.applyTarget == 3) && (
                                        <div className="target-box mb-3">
                                            <label>
                                                ID {formData.applyTarget == 2 ? 'sản phẩm' : 'danh mục'} áp dụng
                                                <span className="text-muted font-weight-normal ml-1">(cách nhau dấu phẩy)</span>
                                            </label>
                                            <input
                                                type="text" className="form-control" name="targetIds"
                                                value={formData.targetIds} onChange={handleChange}
                                                placeholder="VD: 1, 4, 15"
                                            />
                                        </div>
                                    )}

                                    {/* Target: VIP */}
                                    {formData.applyTarget == 4 && (
                                        <div className="vip-group mb-3">
                                            <label className="mb-2" style={{ fontSize: '12px !important' }}>
                                                Chọn hạng VIP được dùng mã:
                                            </label>
                                            <div className="d-flex" style={{ gap: 10 }}>
                                                {[
                                                    { val: '1', label: '🥈 Hạng Bạc',       color: '#6b7280' },
                                                    { val: '2', label: '🥇 Hạng Vàng',       color: '#d97706' },
                                                    { val: '3', label: '💎 Hạng Kim Cương',  color: '#0891b2' },
                                                ].map(t => {
                                                    const checked = formData.targetIds?.split(',').includes(t.val);
                                                    return (
                                                        <label
                                                            key={t.val}
                                                            className={`vip-check ${checked ? 'checked' : ''}`}
                                                        >
                                                            <input
                                                                type="checkbox" value={t.val}
                                                                checked={checked}
                                                                onChange={handleVipChange}
                                                            />
                                                            <div className="vip-dot">
                                                                {checked && <i className="fa fa-check"></i>}
                                                            </div>
                                                            <span className="vip-label" style={{ color: t.color }}>{t.label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            <div className="hint mt-2">
                                                * Không chọn = áp dụng tất cả hạng VIP từ Bạc trở lên
                                            </div>
                                        </div>
                                    )}

                                    {/* Target: Cá nhân */}
                                    {formData.applyTarget == 5 && (
                                        <div className="target-box customer mb-3">
                                            <label>ID Khách hàng được tặng mã</label>
                                            <input
                                                type="text" className="form-control" name="targetIds"
                                                value={formData.targetIds} onChange={handleChange}
                                                placeholder="VD: 550e8400-e29b-41d4-a716-446655440000"
                                            />
                                            <div className="hint">
                                                * Copy ID của khách hàng từ trang "Người dùng" dán vào đây
                                            </div>
                                        </div>
                                    )}

                                    {/* ── SECTION 4: THỜI GIAN & GIỚI HẠN ── */}
                                    <div className="section-head">
                                        <i className="fa fa-clock"></i> 4. Thời gian & Giới hạn
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label>Thời gian bắt đầu</label>
                                            <input
                                                type="datetime-local" className="form-control"
                                                name="startDate" value={formData.startDate} onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label>Thời gian kết thúc <span className="text-danger">*</span></label>
                                            <input
                                                type="datetime-local" className="form-control"
                                                name="expiryDate" value={formData.expiryDate}
                                                onChange={handleChange} required
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label>Tổng lượt dùng</label>
                                            <input
                                                type="number" className="form-control" name="usageLimit"
                                                placeholder="Không giới hạn"
                                                value={formData.usageLimit} onChange={handleChange} min="1"
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label>Giới hạn / khách hàng</label>
                                            <input
                                                type="number" className="form-control" name="usageLimitPerUser"
                                                value={formData.usageLimitPerUser} onChange={handleChange}
                                                min="1" required
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3 d-flex align-items-end">
                                            <div className="switch-wrap w-100">
                                                <div className="custom-control custom-switch">
                                                    <input
                                                        type="checkbox" className="custom-control-input"
                                                        id="activeSwitch" name="isActive"
                                                        checked={formData.isActive} onChange={handleChange}
                                                    />
                                                    <label className="custom-control-label" htmlFor="activeSwitch">
                                                        {formData.isActive ? '✅ Đang kích hoạt' : '⛔ Đang tắt'}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        <i className="fa fa-times mr-1"></i> Hủy bỏ
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className={`fas ${editingId ? 'fa-save' : 'fa-plus'} mr-1`}></i>
                                        {editingId ? 'Lưu thay đổi' : 'Tạo mã giảm giá'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </div>
            )}
        </>
    );
};

export default Vouchers;
