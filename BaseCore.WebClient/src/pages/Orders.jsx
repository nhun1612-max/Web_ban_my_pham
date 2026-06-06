import React, { useState, useEffect, useRef } from 'react';
import { orderApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useReactToPrint } from 'react-to-print';
import '../styles/Orders.css';

const Orders = () => {
    const [orders, setOrders]             = useState([]);
    const [loading, setLoading]           = useState(true);
    const [keyword, setKeyword]           = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage]                 = useState(1);
    const [pageSize]                      = useState(10);
    const [totalPages, setTotalPages]     = useState(0);
    const [totalCount, setTotalCount]     = useState(0);

    const [showModal, setShowModal]         = useState(false);
    const [editingOrder, setEditingOrder]   = useState(null);
    const [formData, setFormData]           = useState({ status: '', note: '' });
    const [error, setError]                 = useState('');

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [currentOrder, setCurrentOrder]       = useState(null);
    const [orderDetails, setOrderDetails]       = useState([]);
    const [detailLoading, setDetailLoading]     = useState(false);

    const printRef = useRef();
    const { isAdmin } = useAuth();

    const orderStatuses = [
        { value: 'Pending',    label: 'Chờ xử lý',         color: 'status-pending'    },
        { value: 'Processing', label: 'Đang chuẩn bị',      color: 'status-processing' },
        { value: 'Shipping',   label: 'Đang giao hàng',     color: 'status-shipping'   },
        { value: 'Delivered',  label: 'Đã giao thành công', color: 'status-delivered'  },
        { value: 'Cancelled',  label: 'Đã huỷ',             color: 'status-cancelled'  },
        { value: 'Returned',   label: 'Hoàn kho',           color: 'status-returned'   },
    ];

    const getStatusInfo = (val) =>
        orderStatuses.find(s => s.value === val) || { label: val, color: 'status-pending' };

    const isFinal = (status) =>
        ['Delivered', 'Cancelled', 'Returned'].includes(status);

    useEffect(() => { loadOrders(); }, [page, statusFilter]); // eslint-disable-line

    const loadOrders = async () => {
        setLoading(true);
        try {
            const res = await orderApi.getAllAdmin();
            let all = res.data || [];
            if (keyword.trim()) {
                const kw = keyword.toLowerCase();
                all = all.filter(o =>
                    o.customerName?.toLowerCase().includes(kw) ||
                    o.phoneNumber?.includes(keyword)
                );
            }
            if (statusFilter) all = all.filter(o => o.status === statusFilter);
            all.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
            setTotalCount(all.length);
            setTotalPages(Math.ceil(all.length / pageSize));
            setOrders(all.slice((page - 1) * pageSize, page * pageSize));
        } catch (e) {
            console.error('Failed to load orders:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => { e.preventDefault(); setPage(1); loadOrders(); };

    const openModal = (order) => {
        setEditingOrder(order);
        setFormData({ status: order.status, note: order.note || '' });
        setError('');
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setEditingOrder(null); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        if (['Returned', 'Cancelled'].includes(formData.status)) {
            if (!window.confirm('Trạng thái này sẽ hoàn lại số lượng rượu vào kho. Bạn có chắc không?')) return;
        }
        try {
            await orderApi.updateStatus(editingOrder.id, formData.status);
            closeModal();
            loadOrders();
            alert('Cập nhật trạng thái thành công!');
        } catch (e) {
            setError(e.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
        }
    };

    // 🟢 HÀM MỚI: XỬ LÝ XÁC NHẬN CHUYỂN KHOẢN (DUYỆT ĐƠN NHANH)
    const handleConfirmPayment = async (orderId) => {
        if (window.confirm("Bạn xác nhận khách hàng này đã chuyển khoản thành công?")) {
            try {
                // Đổi trạng thái từ Pending -> Processing (Đang chuẩn bị hàng)
                await orderApi.updateStatus(orderId, "Processing");
                alert("Đã xác nhận thanh toán & chuyển qua khâu chuẩn bị hàng!");
                loadOrders(); // Tải lại danh sách ngay lập tức
            } catch (error) {
                alert("Lỗi khi xác nhận: " + (error.response?.data?.message || error.message));
            }
        }
    };

    const openDetailModal = async (orderId) => {
        setShowDetailModal(true);
        setDetailLoading(true);
        try {
            const res = await orderApi.getById(orderId);
            setCurrentOrder(res.data.order);
            setOrderDetails(res.data.details);
        } catch {
            alert('Lỗi tải chi tiết đơn hàng!');
            setShowDetailModal(false);
        } finally {
            setDetailLoading(false);
        }
    };
    const closeDetailModal = () => {
        setShowDetailModal(false);
        setCurrentOrder(null);
        setOrderDetails([]);
    };

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `HoaDon_DH${currentOrder?.id || ''}`,
    });

    const renderPagination = () => {
        const pages = [];
        const start = Math.max(1, page - 3);
        const end   = Math.min(totalPages, start + 6);
        for (let i = start; i <= end; i++) {
            pages.push(
                <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(i)}>{i}</button>
                </li>
            );
        }
        return pages;
    };

    return (
        <div className="orders-page">

            {/* ── PAGE HEADER ── */}
            <div className="content-header">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">
                        <h1 className="m-0 font-weight-bold" style={{ fontSize: 20 }}>
                            <i className="fas fa-clipboard-list mr-2 text-primary"></i>
                            Quản lý đơn hàng
                        </h1>
                        <span className="text-muted small">
                            Tổng: <strong className="text-dark">{totalCount}</strong> đơn
                        </span>
                    </div>
                    <ol className="breadcrumb mt-1 mb-0">
                        <li className="breadcrumb-item">Admin</li>
                        <li className="breadcrumb-item active">Đơn hàng</li>
                    </ol>
                </div>
            </div>

            {/* ── CONTENT ── */}
            <section className="content">
                <div className="container-fluid">
                    <div className="card shadow-sm" style={{ borderRadius: 12 }}>

                        {/* THANH LỌC */}
                        <div className="card-header bg-white"
                            style={{ borderRadius: '12px 12px 0 0', borderBottom: '1px solid #f0f0f0' }}>
                            <form onSubmit={handleSearch}>
                                <div className="row align-items-center">
                                    <div className="col-md-5 mb-2 mb-md-0">
                                        <div className="input-group input-group-sm">
                                            <div className="input-group-prepend">
                                                <span className="input-group-text bg-white">
                                                    <i className="fas fa-search text-muted"></i>
                                                </span>
                                            </div>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Tìm tên khách hoặc số điện thoại..."
                                                value={keyword}
                                                onChange={e => setKeyword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4 mb-2 mb-md-0">
                                        <select
                                            className="form-control form-control-sm"
                                            value={statusFilter}
                                            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                            style={{ borderRadius: 8 }}
                                        >
                                            <option value="">-- Tất cả trạng thái --</option>
                                            {orderStatuses.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-3 text-right">
                                        <button type="submit" className="btn btn-sm btn-primary px-4"
                                            style={{ borderRadius: 8 }}>
                                            <i className="fas fa-filter mr-1"></i> Lọc
                                        </button>
                                        {(keyword || statusFilter) && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-link text-danger ml-1 p-0"
                                                onClick={() => { setKeyword(''); setStatusFilter(''); setPage(1); }}
                                            >
                                                <i className="fas fa-times mr-1"></i>Xoá lọc
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* BẢNG */}
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover table-bordered mb-0">
                                    <thead className="thead-light">
                                        <tr style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#6b7280' }}>
                                            <th className="text-center" style={{ width: 60 }}>Mã ĐH</th>
                                            <th style={{ minWidth: 150 }}>Khách hàng</th>
                                            <th style={{ width: 120 }}>Số điện thoại</th>
                                            <th style={{ minWidth: 180 }}>Địa chỉ giao</th>
                                            <th className="text-right" style={{ width: 130 }}>Tổng tiền</th>
                                            <th className="text-center" style={{ width: 110 }}>Ngày đặt</th>
                                            <th className="text-center" style={{ width: 160 }}>Trạng thái</th>
                                            {isAdmin() && (
                                                <th className="text-center" style={{ width: 160 }}>Thao tác</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={isAdmin() ? 8 : 7} className="text-center py-5">
                                                    <div className="spinner-border text-primary mb-2"
                                                        style={{ width: 28, height: 28 }}></div>
                                                    <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                                                        Đang tải dữ liệu...
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : orders.length === 0 ? (
                                            <tr>
                                                <td colSpan={isAdmin() ? 8 : 7}
                                                    className="text-center py-5 text-muted">
                                                    <i className="fas fa-inbox fa-3x d-block mb-3"
                                                        style={{ opacity: 0.15 }}></i>
                                                    Không tìm thấy đơn hàng nào
                                                </td>
                                            </tr>
                                        ) : orders.map(order => {
                                            const si = getStatusInfo(order.status);
                                            return (
                                                <tr key={order.id}>
                                                    <td className="text-center">
                                                        <strong className="text-primary" style={{ fontSize: 13 }}>
                                                            #{order.id}
                                                        </strong>
                                                    </td>
                                                    <td style={{ fontSize: 13 }}>
                                                        {order.customerName ||
                                                            <em className="text-muted">Khách vãng lai</em>}
                                                    </td>
                                                    <td className="text-muted" style={{ fontSize: 13 }}>
                                                        {order.phoneNumber || '—'}
                                                    </td>
                                                    <td>
                                                        <span className="text-muted d-block text-truncate"
                                                            style={{ maxWidth: 200, fontSize: 12 }}
                                                            title={order.shippingAddress}>
                                                            {order.shippingAddress || '—'}
                                                        </span>
                                                    </td>
                                                    <td className="text-right">
                                                        <span className="font-weight-bold text-danger"
                                                            style={{ fontSize: 13 }}>
                                                            {order.totalAmount?.toLocaleString('vi-VN')} đ
                                                        </span>
                                                    </td>
                                                    <td className="text-center text-muted" style={{ fontSize: 12 }}>
                                                        {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`badge ${si.color}`}>{si.label}</span>
                                                    </td>
                                                    {isAdmin() && (
                                                        <td className="text-center">
                                                            {/* 🟢 NÚT MỚI: Chỉ hiện lên khi là Đơn BANK/MOMO đang chờ xử lý */}
                                                            {order.status === 'Pending' && ['BANK', 'MOMO'].includes(order.paymentMethod) && (
                                                                <button
                                                                    className="btn btn-sm btn-success mr-1"
                                                                    title="Xác nhận đã nhận tiền"
                                                                    onClick={() => handleConfirmPayment(order.id)}
                                                                >
                                                                    <i className="fas fa-check-double"></i>
                                                                </button>
                                                            )}

                                                            <button
                                                                className="btn btn-sm btn-outline-secondary mr-1"
                                                                title="Xem chi tiết & In hóa đơn"
                                                                onClick={() => openDetailModal(order.id)}
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-info"
                                                                title="Cập nhật trạng thái thủ công"
                                                                onClick={() => openModal(order)}
                                                                disabled={isFinal(order.status)}
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* PHÂN TRANG */}
                        {!loading && totalCount > 0 && (
                            <div className="card-footer bg-white d-flex justify-content-between align-items-center flex-wrap"
                                style={{ borderTop: '1px solid #f0f0f0', borderRadius: '0 0 12px 12px' }}>
                                <span className="text-muted small mb-1">
                                    Hiển thị <strong>{orders.length}</strong> / <strong>{totalCount}</strong> đơn hàng
                                </span>
                                <ul className="pagination pagination-sm mb-1">
                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p => p - 1)}>«</button>
                                    </li>
                                    {renderPagination()}
                                    <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p => p + 1)}>»</button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ══ MODAL 1 — Cập nhật trạng thái ══ */}
            {showModal && (
                <div className="orders-modal">
                    <div className="modal fade show" style={{ display: 'block' }}
                        onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                        <div className="modal-dialog">
                            <form className="modal-content" onSubmit={handleSubmit}
                                style={{ borderRadius: 12 }}>
                                <div className="modal-header bg-primary text-white"
                                    style={{ borderRadius: '12px 12px 0 0' }}>
                                    <h5 className="modal-title font-weight-bold" style={{ fontSize: 15 }}>
                                        <i className="fas fa-edit mr-2"></i>
                                        Cập nhật đơn hàng #{editingOrder?.id}
                                    </h5>
                                    <button type="button" className="close text-white" onClick={closeModal}>
                                        <span>&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    {error && (
                                        <div className="alert alert-danger py-2" style={{ fontSize: 13 }}>
                                            <i className="fas fa-exclamation-triangle mr-2"></i>{error}
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label className="font-weight-bold" style={{ fontSize: 13 }}>
                                            Trạng thái đơn hàng
                                        </label>
                                        <select
                                            className="form-control"
                                            value={formData.status}
                                            onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                                            required
                                            style={{ borderRadius: 8, fontSize: 13 }}
                                        >
                                            {orderStatuses.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group mb-0">
                                        <label className="font-weight-bold" style={{ fontSize: 13 }}>
                                            Ghi chú nội bộ
                                        </label>
                                        <textarea
                                            className="form-control" rows="3"
                                            placeholder="Ghi chú cho đơn này (không hiển thị với khách)..."
                                            value={formData.note}
                                            onChange={e => setFormData(f => ({ ...f, note: e.target.value }))}
                                            style={{ borderRadius: 8, fontSize: 13 }}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ borderTop: '1px solid #f0f0f0' }}>
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}
                                        style={{ borderRadius: 8, fontSize: 13 }}>
                                        <i className="fas fa-times mr-1"></i> Hủy
                                    </button>
                                    <button type="submit" className="btn btn-primary"
                                        style={{ borderRadius: 8, fontSize: 13 }}>
                                        <i className="fas fa-save mr-1"></i> Lưu thay đổi
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </div>
            )}

            {/* ══ MODAL 2 — Chi tiết & In hóa đơn ══ */}
            {showDetailModal && (
                <div className="orders-modal">
                    <div className="modal fade show" style={{ display: 'block' }}
                        onClick={e => { if (e.target === e.currentTarget) closeDetailModal(); }}>
                        <div className="modal-dialog modal-lg modal-dialog-scrollable">
                            <div className="modal-content" style={{ borderRadius: 12 }}>

                                <div className="modal-header bg-dark text-white no-print"
                                    style={{ borderRadius: '12px 12px 0 0' }}>
                                    <h5 className="modal-title font-weight-bold" style={{ fontSize: 15 }}>
                                        <i className="fas fa-receipt mr-2"></i>
                                        Chi tiết đơn hàng #{currentOrder?.id}
                                    </h5>
                                    <div className="d-flex align-items-center" style={{ gap: 10 }}>
                                        <button className="btn btn-sm btn-success" onClick={handlePrint}
                                            disabled={detailLoading} style={{ borderRadius: 8, fontSize: 13 }}>
                                            <i className="fas fa-print mr-1"></i> In hóa đơn
                                        </button>
                                        <button type="button" className="close text-white m-0 ml-2"
                                            onClick={closeDetailModal}>
                                            <span style={{ fontSize: 22 }}>&times;</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="modal-body" style={{ background: '#f8f9fb', padding: 20 }}>
                                    {detailLoading ? (
                                        <div className="text-center py-5">
                                            <div className="spinner-border text-primary mb-2"></div>
                                            <p className="text-muted" style={{ fontSize: 13 }}>
                                                Đang tải chi tiết...
                                            </p>
                                        </div>
                                    ) : (
                                        <div ref={printRef}
                                            style={{ padding: 24, background: '#fff', borderRadius: 10 }}>

                                            {/* Tiêu đề */}
                                            <div className="text-center mb-4">
                                                <h3 className="font-weight-bold mb-1"
                                                    style={{ fontSize: 20, letterSpacing: '-0.3px' }}>
                                                    🍷 CỬA HÀNG RƯỢU NHÀ GIANG
                                                </h3>
                                                <p className="text-muted mb-0" style={{ fontSize: 13 }}>Hóa đơn bán lẻ</p>
                                                <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                                                    Mã ĐH: <strong>#{currentOrder?.id}</strong>
                                                    &nbsp;·&nbsp;
                                                    Ngày: <strong>
                                                        {new Date(currentOrder?.orderDate).toLocaleDateString('vi-VN')}
                                                    </strong>
                                                </p>
                                            </div>

                                            {/* Thông tin */}
                                            <div className="row mb-4">
                                                <div className="col-sm-6">
                                                    <div className="p-3" style={{ background: '#f8f9fb', borderRadius: 8 }}>
                                                        <p className="font-weight-bold mb-2 text-muted"
                                                            style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            Thông tin giao hàng
                                                        </p>
                                                        <div style={{ fontSize: 13 }}>
                                                            <div><strong>Khách hàng:</strong> {currentOrder?.customerName || 'Khách vãng lai'}</div>
                                                            <div><strong>Điện thoại:</strong> {currentOrder?.phoneNumber || '—'}</div>
                                                            <div><strong>Địa chỉ:</strong> {currentOrder?.shippingAddress || '—'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-sm-6">
                                                    <div className="p-3" style={{ background: '#f8f9fb', borderRadius: 8 }}>
                                                        <p className="font-weight-bold mb-2 text-muted"
                                                            style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            Thanh toán
                                                        </p>
                                                        <div style={{ fontSize: 13 }}>
                                                            <div><strong>Phương thức:</strong> {currentOrder?.paymentMethod === 'COD' ? 'COD (Thu hộ khi giao)' : currentOrder?.paymentMethod}</div>
                                                            <div>
                                                                <strong>Trạng thái:</strong>{' '}
                                                                <span className={`badge ${getStatusInfo(currentOrder?.status).color} ml-1`}>
                                                                    {getStatusInfo(currentOrder?.status).label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bảng SP */}
                                            <p className="font-weight-bold mb-2" style={{ fontSize: 13 }}>
                                                Sản phẩm đã mua:
                                            </p>
                                            <table className="table table-bordered table-sm mb-0"
                                                style={{ fontSize: 13 }}>
                                                <thead className="thead-light">
                                                    <tr>
                                                        <th className="text-center" style={{ width: 40 }}>STT</th>
                                                        <th>Sản phẩm</th>
                                                        <th className="text-center" style={{ width: 70 }}>SL</th>
                                                        <th className="text-right" style={{ width: 120 }}>Đơn giá</th>
                                                        <th className="text-right" style={{ width: 130 }}>Thành tiền</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orderDetails.map((item, idx) => (
                                                        <tr key={item.id}>
                                                            <td className="text-center text-muted">{idx + 1}</td>
                                                            <td>{item.productName || `Sản phẩm #${item.productId}`}</td>
                                                            <td className="text-center">{item.quantity}</td>
                                                            <td className="text-right">
                                                                {item.unitPrice?.toLocaleString('vi-VN')} đ
                                                            </td>
                                                            <td className="text-right font-weight-bold">
                                                                {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            {/* Tổng kết */}
                                            <div className="row justify-content-end mt-3">
                                                <div className="col-sm-5">
                                                    <table className="table table-sm table-borderless mb-0"
                                                        style={{ fontSize: 13 }}>
                                                        <tbody>
                                                            <tr>
                                                                <td className="text-muted">Tạm tính:</td>
                                                                <td className="text-right">
                                                                    {(currentOrder?.totalAmount + (currentOrder?.discountAmount || 0))
                                                                        .toLocaleString('vi-VN')} đ
                                                                </td>
                                                            </tr>
                                                            {currentOrder?.discountAmount > 0 && (
                                                                <tr>
                                                                    <td className="text-success">Giảm giá (Voucher):</td>
                                                                    <td className="text-right text-success">
                                                                        − {currentOrder.discountAmount.toLocaleString('vi-VN')} đ
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            <tr style={{ borderTop: '2px solid #e5e7eb' }}>
                                                                <td className="font-weight-bold pt-2" style={{ fontSize: 14 }}>
                                                                    Tổng thanh toán:
                                                                </td>
                                                                <td className="text-right font-weight-bold text-danger pt-2"
                                                                    style={{ fontSize: 16 }}>
                                                                    {currentOrder?.totalAmount?.toLocaleString('vi-VN')} đ
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            <div className="text-center mt-4 pt-3"
                                                style={{ borderTop: '1px dashed #e5e7eb' }}>
                                                <p className="text-muted font-italic mb-0" style={{ fontSize: 13 }}>
                                                    Cảm ơn quý khách đã mua hàng! 🙏
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer bg-white no-print"
                                    style={{ borderTop: '1px solid #f0f0f0', borderRadius: '0 0 12px 12px' }}>
                                    <button className="btn btn-secondary" onClick={closeDetailModal}
                                        style={{ borderRadius: 8, fontSize: 13 }}>
                                        <i className="fas fa-times mr-1"></i> Đóng
                                    </button>
                                    <button className="btn btn-success" onClick={handlePrint}
                                        disabled={detailLoading} style={{ borderRadius: 8, fontSize: 13 }}>
                                        <i className="fas fa-print mr-1"></i> In hóa đơn
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </div>
            )}

        </div>
    );
};

export default Orders;