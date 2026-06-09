import React, { useState, useEffect } from 'react';
import { orderApi, productReviewApi } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/MyOrders.css';


// ── COMPONENT: THANH TIẾN TRÌNH ĐƠN HÀNG ──
const OrderProgress = ({ status }) => {
    const steps = [
        { id: 'Pending', label: 'Chờ xác nhận', icon: 'fas fa-file-invoice' },
        { id: 'Processing', label: 'Đang chuẩn bị', icon: 'fas fa-box-open' },
        { id: 'Shipping', label: 'Đang giao', icon: 'fas fa-truck' },
        { id: 'Completed', label: 'Đã nhận', icon: 'fas fa-star' }
    ];

    if (status === 'Cancelled') {
        return (
            <div className="mo-progress-cancelled">
                <i className="fas fa-times-circle mr-2"></i> Đơn hàng này đã bị hủy
            </div>
        );
    }

    let currentIndex = steps.findIndex(s => s.id === status);
    if (currentIndex === -1) currentIndex = 0;

    return (
        <div className="mo-progress-bar">
            {steps.map((step, index) => {
                const isActive = index <= currentIndex;
                const isLast = index === steps.length - 1;
                return (
                    <div key={step.id} className={`mo-step ${isActive ? 'active' : ''}`}>
                        <div className="mo-step-icon">
                            <i className={step.icon}></i>
                        </div>
                        <div className="mo-step-label">{step.label}</div>
                        {!isLast && <div className={`mo-step-line ${index < currentIndex ? 'active' : ''}`}></div>}
                    </div>
                );
            })}
        </div>
    );
};

const MyOrders = () => {
    const { user } = useAuth();
    const navigate  = useNavigate();

    const [orders, setOrders]               = useState([]);
    const [loading, setLoading]             = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);

    const [showReviewModal, setShowReviewModal]         = useState(false);
    const [selectedItemToReview, setSelectedItemToReview] = useState(null);
    const [reviewForm, setReviewForm]                   = useState({ rating: 5, comment: '' });
    const [isSubmitting, setIsSubmitting]               = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);

    // 🟢 STATE MỚI: Lưu danh sách ID của các OrderDetail đã được đánh giá
    const [reviewedItems, setReviewedItems] = useState([]);
    // STATE CHO MODAL SỬA THÔNG TIN ĐƠN HÀNG
    const [showEditInfoModal, setShowEditInfoModal] = useState(false);
    const [editInfoForm, setEditInfoForm] = useState({ customerName: '', phoneNumber: '', shippingAddress: '', orderId: null });
    const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
    // States cho tính năng Hủy đơn hàng
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [customCancelReason, setCustomCancelReason] = useState('');

    const cancelReasonOptions = [
        "Muốn thay đổi địa chỉ giao hàng",
        "Muốn thay đổi sản phẩm / số lượng",
        "Tìm thấy giá rẻ hơn ở nơi khác",
        "Đổi ý, không muốn mua nữa",
        "Thời gian giao hàng dự kiến quá lâu",
        "Khác"
    ];



    // Hàm mở modal khi bấm nút "Hủy đơn hàng này"
    const handleOpenCancelModal = (orderId) => {
        setOrderToCancel(orderId);
        setCancelReason('');
        setCustomCancelReason('');
        setShowCancelModal(true);
    };

    // Hàm gọi API gửi lý do
    const submitCancelOrder = async (e) => {
        e.preventDefault();
        
        // Gộp lý do
        const finalReason = cancelReason === 'Khác' ? customCancelReason : cancelReason;
        
        if (!finalReason.trim()) {
            alert('Vui lòng chọn hoặc nhập lý do hủy đơn!');
            return;
        }

        try {
            setIsSubmitting(true);
            // 🟢 Gọi API hủy đơn truyền kèm lý do
            await orderApi.cancelOrder(orderToCancel, finalReason);
            
            alert('Hủy đơn hàng thành công.');
            setShowCancelModal(false);
            fetchOrders(); // Load lại danh sách đơn
        } catch (error) {
            alert('Lỗi khi hủy đơn: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };
    const fetchOrders = async () => {
        try {
            const res = await orderApi.getMyOrders();
            setOrders(res.data.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)));
        } catch (e) {
            console.error('Lỗi tải đơn hàng:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const getPaymentName = (method) => {
        switch(method) {
            case 'COD': return 'Nhận hàng (COD)';
            case 'BANK': return 'Chuyển khoản';
            case 'MOMO': return 'Ví MoMo';
            case 'VNPAY': return 'VNPAY';
            default: return method || 'Khác';
        }
    };
    const handleFileChange = (files) => {
        const fileArray = Array.from(files);
        setSelectedFiles(prev => [...prev, ...fileArray].slice(0, 5)); // Cho phép up tối đa 5 ảnh
    };

    // Hàm xóa ảnh đã chọn
    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirmReceipt = async (orderId) => {
        if (!window.confirm('Bạn xác nhận đã nhận được hàng và hài lòng với sản phẩm?')) return;
        try {
            await orderApi.confirmReceipt(orderId);
            alert('Cảm ơn bạn đã mua sắm!');
            fetchOrders();
        } catch (e) { alert('Có lỗi xảy ra: ' + (e.response?.data?.message || 'Vui lòng thử lại')); }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
        try {
            await orderApi.cancelOrder(orderId); 
            alert('Đã hủy đơn hàng thành công.');
            fetchOrders();
        } catch (e) { alert('Lỗi: ' + (e.response?.data?.message || 'Không thể hủy đơn hàng lúc này.')); }
    };

    const handleBuyAgain = (productId) => { if(productId) navigate(`/product/${productId}`); };

    const openReviewModal = (item) => {
        setSelectedItemToReview(item);
        setReviewForm({ rating: 5, comment: '' });
        setShowReviewModal(true);
    };

   const submitReview = async (e) => {
        e.preventDefault();
        if (!reviewForm.comment.trim()) { alert('Vui lòng nhập nội dung đánh giá!'); return; }
        
        const confirmMsg = "CẢNH BÁO QUAN TRỌNG!\n\nNếu sản phẩm có lỗi, Shop hỗ trợ hoàn tiền và đổi trả miễn phí 100%.\nTuy nhiên, sau khi bạn gửi đánh giá này, chính sách đổi trả sẽ KHÔNG còn hiệu lực.\n\nBạn có chắc chắn muốn gửi đánh giá không?";
        if (!window.confirm(confirmMsg)) return;

        setIsSubmitting(true);

        // 🟢 ĐÓNG GÓI DỮ LIỆU DẠNG FORMDATA
        const formData = new FormData();
        formData.append('orderId', parseInt(selectedItemToReview.orderId || selectedItemToReview.OrderId, 10));
        formData.append('productId', parseInt(selectedItemToReview.prodId, 10));
        formData.append('customerName', user?.name || 'Khách hàng');
        formData.append('rating', parseInt(reviewForm.rating, 10));
        formData.append('comment', reviewForm.comment);
        formData.append('variantName', selectedItemToReview.variantName || 'Mặc định');
        if (user?.id) formData.append('userId', user.id);

        // Nhồi các file ảnh vào FormData
        selectedFiles.forEach((file) => {
            formData.append('ReviewImages', file); // Tên phải khớp chính xác với DTO bên C#
        });

        try {
            await productReviewApi.create(formData);
            
            const currentDetailId = selectedItemToReview.id || selectedItemToReview.Id;
            setReviewedItems(prev => [...prev, currentDetailId]);

            setIsSubmitting(false);
            setShowReviewModal(false);
            setSelectedFiles([]); // Reset trắng ảnh sau khi gửi
            alert('🎉 Đánh giá thành công! Cảm ơn phản hồi của bạn.');
            setSelectedItemToReview(null);
            fetchOrders();
        } catch (e) {
            setIsSubmitting(false);
            alert('Lỗi: ' + (e.response?.data?.message || 'Không thể gửi đánh giá lúc này.'));
        }
    };
    const openEditInfoModal = (order) => {
        setEditInfoForm({
            orderId: order.id,
            customerName: order.customerName || '',
            phoneNumber: order.phoneNumber || '',
            shippingAddress: order.shippingAddress || ''
        });
        setShowEditInfoModal(true);
    };

    const submitUpdateInfo = async (e) => {
        e.preventDefault();
        setIsUpdatingInfo(true);
        try {
            await orderApi.updateInfo(editInfoForm.orderId, {
                customerName: editInfoForm.customerName,
                phoneNumber: editInfoForm.phoneNumber,
                shippingAddress: editInfoForm.shippingAddress
            });
            alert('Cập nhật thông tin thành công!');
            setShowEditInfoModal(false);
            fetchOrders(); // Tải lại danh sách đơn hàng
        } catch (e) {
            alert('Lỗi: ' + (e.response?.data?.message || 'Không thể cập nhật thông tin lúc này.'));
        } finally {
            setIsUpdatingInfo(false);
        }
    };

    if (loading) return <div className="mo-loading"><div className="mo-spinner"></div>Đang tải dữ liệu đơn hàng...</div>;

    return (
        <div className="mo-page">
            <div className="container" style={{ maxWidth: '1050px' }}>

                <div className="mo-header-section text-center mb-5 mt-4">
                    <h1 className="mo-title" style={{ fontFamily: '"Cormorant Garamond", serif', color: '#0d4a3b', fontWeight: 700 }}>
                        Lịch Sử Đơn Hàng
                    </h1>
                    <p className="mo-subtitle text-muted">Theo dõi lộ trình giao nhận và quản lý thông tin hóa đơn chi tiết.</p>
                </div>

                {orders.length === 0 ? (
                    <div className="mo-empty text-center py-5 shadow-sm bg-white" style={{ borderRadius: '12px' }}>
                        <i className="fas fa-shopping-bag fa-3x mb-3" style={{ color: '#e2f0ed' }}></i>
                        <h4>Bạn chưa có đơn hàng nào</h4>
                        <Link to="/shop" className="btn font-weight-bold px-4 py-2 mt-3" style={{ backgroundColor: '#0d4a3b', color: '#fff', borderRadius: '30px' }}>Mua sắm ngay</Link>
                    </div>
                ) : (
                    <div className="mo-order-list">
                        {orders.map(order => {
                            const items      = order.orderDetails || order.orderItems || order.OrderDetails || [];
                            const isExpanded = expandedOrder === order.id;
                            const status     = order.status || order.Status;

                            const itemsTotal = items.reduce((acc, i) => acc + ((i.unitPrice || i.UnitPrice) * (i.quantity || i.Quantity)), 0);
                            const discountAmt = order.discountAmount || order.DiscountAmount || 0;
                            const totalAmt = order.totalAmount || order.TotalAmount || 0;
                            const shippingFee = Math.max(0, totalAmt - itemsTotal + discountAmt);

                            return (
                                <div key={order.id} className={`mo-order-card shadow-sm mb-4 bg-white ${isExpanded ? 'is-expanded' : ''}`} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2f0ed' }}>
                                    
                                    <div className="mo-order-header p-3" style={{ backgroundColor: '#fafdfb', borderBottom: '1px solid #e2f0ed', cursor: 'pointer' }} onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <div className="d-flex align-items-center">
                                                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} mr-3 text-muted`}></i>
                                                <strong style={{ color: '#0d4a3b', fontSize: '16px' }}>Đơn hàng #{order.id}</strong>
                                                <span className="badge badge-light ml-2 border" style={{ color: '#555', fontSize: '12px' }}>
                                                    <i className="far fa-credit-card mr-1"></i> {getPaymentName(order.paymentMethod)}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-weight-bold" style={{ color: '#880e4f', fontSize: '18px' }}>
                                                    {totalAmt?.toLocaleString('vi-VN')} đ
                                                </span>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between text-muted small pl-4 ml-2">
                                            <div>
                                                <i className="far fa-calendar-alt mr-1"></i> Ngày đặt: {new Date(order.orderDate || order.OrderDate).toLocaleDateString('vi-VN')}
                                            </div>
                                            <div style={{ color: '#0d4a3b', fontWeight: 600 }}>
                                                {status === 'Pending' && '⏳ Chờ xác nhận'}
                                                {status === 'Processing' && '📦 Đang chuẩn bị hàng'}
                                                {status === 'Shipping' && '🚚 Đang giao hàng'}
                                                {status === 'Completed' && '✅ Hoàn thành'}
                                                {status === 'Cancelled' && '❌ Đã hủy'}
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="mo-order-details p-4" style={{ backgroundColor: '#fff' }}>
                                            <div className="mb-4 pb-3 border-bottom"><OrderProgress status={status} /></div>

                                            <div className="row">
                                                <div className="col-md-5 border-right pr-4">
                                                    <div className="mo-info-group mb-4">
                                        
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h6 className="font-weight-bold m-0" style={{ color: '#0d4a3b', textTransform: 'uppercase', fontSize: '13px' }}>
                                                    <i className="fas fa-map-marker-alt mr-2"></i> Thông tin giao nhận
                                                </h6>
                                                {status === 'Pending' && (
                                                    <button type="button" className="btn btn-sm btn-link text-primary p-0" style={{ fontSize: '12px', textDecoration: 'underline' }} onClick={(e) => { e.stopPropagation(); openEditInfoModal(order); }}>
                                                        <i className="fas fa-edit"></i> Thay đổi
                                                    </button>
                                                )}
                                            </div>
                                                                                                    <div className="p-3 border rounded bg-light" style={{ fontSize: '13.5px', lineHeight: '1.6' }}>
                                                            <div><strong>Người nhận:</strong> {order.customerName}</div>
                                                            <div><strong>SĐT:</strong> <span className="font-weight-bold">{order.phoneNumber || 'N/A'}</span></div>
                                                            <div><strong>Địa chỉ:</strong> {order.shippingAddress}</div>
                                                        </div>
                                                    </div>

                                                    <div className="mo-info-group mb-3">
                                                        <h6 className="font-weight-bold mb-2" style={{ color: '#0d4a3b', textTransform: 'uppercase', fontSize: '13px' }}><i className="fas fa-calculator mr-2"></i> Chi tiết dòng tiền</h6>
                                                        <div className="p-3 border rounded" style={{ fontSize: '13.5px', backgroundColor: '#fafdfb' }}>
                                                            <div className="d-flex justify-content-between mb-2"><span className="text-muted">Tạm tính:</span><span className="font-weight-bold">{itemsTotal.toLocaleString('vi-VN')} đ</span></div>
                                                            <div className="d-flex justify-content-between mb-2"><span className="text-muted">Phí ship:</span><span className="font-weight-bold" style={{ color: '#0d4a3b' }}>{shippingFee > 0 ? `+${shippingFee.toLocaleString('vi-VN')} đ` : 'Miễn phí'}</span></div>
                                                            {discountAmt > 0 && <div className="d-flex justify-content-between mb-2 text-danger font-weight-bold"><span><i className="fas fa-ticket-alt mr-1"></i> Voucher:</span><span>-{discountAmt.toLocaleString('vi-VN')} đ</span></div>}
                                                            <hr className="my-2" />
                                                            <div className="d-flex justify-content-between align-items-center pt-1"><span className="font-weight-bold">Thanh toán:</span><span className="font-weight-bold" style={{ fontSize: '18px', color: '#880e4f' }}>{totalAmt.toLocaleString('vi-VN')} đ</span></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-md-7 pl-4">
                                                    <h6 className="font-weight-bold mb-3" style={{ color: '#0d4a3b', textTransform: 'uppercase', fontSize: '13px' }}><i className="fas fa-box mr-2"></i> Danh sách sản phẩm</h6>
                                                    <div className="mo-items-scroll" style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '5px' }}>
                                                        
                                                        {items.map((item, idx) => {
                                                            const detailId = item.id || item.Id; 
                                                            const prodId = item.productId || item.ProductId || item.product?.id || item.Product?.id;
                                                            const imgUrl = item.product?.imageUrl || item.Product?.ImageUrl || item.imageUrl || item.ImageUrl || '/images/prod-1.jpg';
                                                            const prodName = item.product?.name || item.Product?.Name || item.productName || item.ProductName || 'Sản phẩm';
                                                            const variantName = item.variantName || item.VariantName || 'Mặc định';

                                                            // 🟢 KIỂM TRA SẢN PHẨM NÀY ĐÃ ĐÁNH GIÁ CHƯA
                                                            // Nếu Backend trả về isReviewed = true (nếu bạn có code) HOẶC nếu nó nằm trong state 'reviewedItems' vừa đánh giá xong
                                                            const hasBeenReviewed = item.isReviewed || item.IsReviewed || reviewedItems.includes(detailId);

                                                            return (
                                                                <div key={idx} className="mo-order-item d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                                                                    <div className="d-flex align-items-center" style={{ minWidth: 0, flex: 1 }}>
                                                                        <img src={imgUrl} alt={prodName} className="rounded border" style={{ width: '65px', height: '65px', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.src = '/images/prod-1.jpg'; }} />
                                                                        <div className="ml-3" style={{ minWidth: 0 }}>
                                                                            <Link to={`/product/${prodId}`} className="font-weight-bold text-dark text-truncate d-block" style={{ textDecoration: 'none', fontSize: '14px' }}>{prodName}</Link>
                                                                            <div className="text-muted small mt-1">Phân loại: {variantName}</div>
                                                                            <div className="text-muted small">Số lượng: x{item.quantity || item.Quantity}</div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="text-right ml-3">
                                                                        <div className="mb-2 font-weight-bold" style={{ color: '#333', fontSize: '14px' }}>
                                                                            {(item.unitPrice || item.UnitPrice)?.toLocaleString('vi-VN')} đ
                                                                        </div>
                                                                        <div className="d-flex gap-1 justify-content-end">
                                                                            <button type="button" className="btn btn-xs btn-outline-secondary py-1 px-2" style={{ fontSize: '11px', marginRight: '5px' }} onClick={() => handleBuyAgain(prodId)}><i className="fas fa-redo mr-1"></i> Mua lại</button>
                                                                            
                                                                            {(status === 'Completed' || order.Status === 'Completed') && (
                                                                                // 🟢 HIỂN THỊ NÚT TƯƠNG ỨNG VỚI TRẠNG THÁI ĐÁNH GIÁ
                                                                                hasBeenReviewed ? (
                                                                                    <button type="button" className="btn btn-xs text-white py-1 px-2" style={{ backgroundColor: '#6c757d', fontSize: '11px' }} onClick={() => navigate(`/product/${prodId}#reviews`)}>
                                                                                        <i className="fas fa-eye mr-1"></i> Xem đánh giá
                                                                                    </button>
                                                                                ) : (
                                                                                                                                                                        <button type="button" className="btn btn-xs text-white py-1 px-2" style={{ backgroundColor: '#0d4a3b', fontSize: '11px' }} 
                                                                                        onClick={() => openReviewModal({ ...item, imgUrl, prodName, prodId, variantName, orderId: order.id })} // 🟢 Đã thêm orderId
                                                                                    >
                                                                                        <i className="fas fa-star mr-1" style={{ color: '#c9a84c' }}></i> Đánh giá
                                                                                    </button>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="d-flex justify-content-end mt-4 pt-2 border-top">
                                                        {(status === 'Pending' || status === 'Processing') && (
                                                            <button 
                                                                    type="button" 
                                                                    className="btn btn-outline-danger btn-sm font-weight-bold px-4" 
                                                                    style={{ borderRadius: '20px' }} 
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        handleOpenCancelModal(order.id); // 🟢 ĐỔI TÊN HÀM Ở ĐÂY
                                                                    }}
                                                                >
                                                                    <i className="fas fa-times mr-1"></i> Hủy đơn hàng này
                                                                </button>
                                                        )}
                                                        {status === 'Shipping' && (
                                                            <button type="button" className="btn btn-success btn-sm font-weight-bold px-4" style={{ borderRadius: '20px' }} onClick={(e) => { e.stopPropagation(); handleConfirmReceipt(order.id); }}><i className="fas fa-check-circle mr-1"></i> Tôi đã nhận được hàng</button>
                                                        )}
                                                    </div>

                                                </div>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ══ MODAL ĐÁNH GIÁ ══ */}
            {showReviewModal && selectedItemToReview && (
                <div className="mo-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowReviewModal(false); }}>
                    <div className="mo-modal">
                        <div className="mo-modal-header" style={{ backgroundColor: '#fafdfb', borderBottom: '1px solid #e2f0ed' }}>
                            <h5 className="m-0 font-weight-bold" style={{ color: '#0d4a3b' }}><i className="fas fa-star mr-2" style={{ color: '#C9A84C' }}></i>Đánh giá sản phẩm</h5>
                            <button type="button" className="mo-modal-close btn btn-link text-dark p-0" onClick={() => setShowReviewModal(false)}>&times;</button>
                        </div>
                       <form onSubmit={submitReview}>
                            <div className="mo-modal-body p-4">
                                
                                {/* Lời nhắc CSKH để giảm 1 sao */}
                                <div className="alert mb-4" style={{ backgroundColor: '#fce4ec', color: '#880e4f', border: '1px solid #f8bbd0', borderRadius: '8px', fontSize: '13.5px' }}>
                                    <i className="fas fa-heart mr-2"></i>
                                    <strong>Khoan vội đánh giá thấp!</strong> Nếu sản phẩm có lỗi hoặc bạn chưa hài lòng, xin hãy <Link to="/contact" style={{ color: '#880e4f', textDecoration: 'underline', fontWeight: 'bold' }}>liên hệ bộ phận hỗ trợ</Link> để được đổi trả miễn phí nhé!
                                </div>
                                
                                <div className="d-flex align-items-center mb-4 p-3 border rounded" style={{ backgroundColor: '#f9f9f9' }}>
                                    <img src={selectedItemToReview.imgUrl} alt="product" className="rounded border" style={{ width: '60px', height: '60px', objectFit: 'cover' }} onError={e => { e.target.src = '/images/prod-1.jpg'; }} />
                                    <div className="ml-3">
                                        <div className="font-weight-bold">{selectedItemToReview.prodName}</div>
                                        <div className="text-muted small">Phân loại: {selectedItemToReview.variantName}</div>
                                    </div>
                                </div>
                                
                                <div className="text-center mb-4">
                                    <div className="mb-2 font-weight-bold text-muted">Chất lượng sản phẩm như thế nào?</div>
                                    <div className="mo-stars d-flex justify-content-center" style={{ gap: '10px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <i key={star} className={`fa-star ${star <= reviewForm.rating ? 'fas' : 'far'}`} style={{ fontSize: '32px', color: star <= reviewForm.rating ? '#c9a84c' : '#ccc', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setReviewForm(f => ({ ...f, rating: star }))} />
                                        ))}
                                    </div>
                                </div>
                                
                                <textarea className="form-control" rows="4" placeholder="Hãy chia sẻ cảm nhận chân thực của bạn về chất lượng sản phẩm này nhé..." value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} required style={{ borderRadius: '8px' }} />

                                {/* 🟢 ĐOẠN MỚI THÊM: KHU VỰC KÉO THẢ ẢNH NẰM Ở ĐÂY */}
                                <div className="mt-3">
                                    <label className="font-weight-bold small text-muted mb-2">Đính kèm hình ảnh thực tế (Tối đa 5 ảnh)</label>
                                    <div 
                                        className="mo-upload-zone"
                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragging'); }}
                                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('dragging'); }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('dragging');
                                            handleFileChange(e.dataTransfer.files);
                                        }}
                                        onClick={() => document.getElementById('fileInput').click()}
                                    >
                                        <i className="fas fa-cloud-upload-alt fa-2x mb-2" style={{ color: '#0d4a3b' }}></i>
                                        <p className="m-0 small">Kéo thả ảnh vào đây hoặc click để tải lên</p>
                                        <input type="file" id="fileInput" hidden multiple accept="image/*" onChange={(e) => handleFileChange(e.target.files)} />
                                    </div>

                                    {/* 🟢 HIỂN THỊ ẢNH XEM TRƯỚC (PREVIEW) */}
                                    {selectedFiles.length > 0 && (
                                        <div className="d-flex flex-wrap mt-3" style={{ gap: '12px' }}>
                                            {selectedFiles.map((file, idx) => (
                                                <div key={idx} className="position-relative">
                                                    <img 
                                                        src={URL.createObjectURL(file)} 
                                                        alt="preview"
                                                        className="shadow-sm"
                                                        style={{ width: '65px', height: '65px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }} 
                                                    />
                                                    <button type="button" className="mo-remove-img" onClick={(e) => { e.stopPropagation(); removeFile(idx); }}>&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* KẾT THÚC ĐOẠN KÉO THẢ */}

                            </div>
                            
                            <div className="mo-modal-footer p-3 border-top d-flex justify-content-end" style={{ backgroundColor: '#fafdfb' }}>
                                <button type="button" className="btn btn-light mr-2 font-weight-bold" onClick={() => setShowReviewModal(false)}>Trở lại</button>
                                <button type="submit" className="btn text-white font-weight-bold" style={{ backgroundColor: '#0d4a3b' }} disabled={isSubmitting}>
                                    {isSubmitting ? <><span className="spinner-border spinner-border-sm mr-2"></span> Đang gửi...</> : <><i className="fas fa-paper-plane mr-2"></i> Gửi đánh giá</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ══ MODAL SỬA THÔNG TIN ĐƠN HÀNG ══ */}
            {showEditInfoModal && (
                <div className="mo-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowEditInfoModal(false); }}>
                    <div className="mo-modal">
                        <div className="mo-modal-header" style={{ backgroundColor: '#fafdfb', borderBottom: '1px solid #e2f0ed' }}>
                            <h5 className="m-0 font-weight-bold" style={{ color: '#0d4a3b' }}><i className="fas fa-edit mr-2"></i>Sửa thông tin giao hàng</h5>
                            <button type="button" className="mo-modal-close btn btn-link text-dark p-0" onClick={() => setShowEditInfoModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={submitUpdateInfo}>
                            <div className="mo-modal-body p-4">
                                <div className="alert alert-warning small mb-4">
                                    <i className="fas fa-info-circle mr-1"></i> Bạn chỉ có thể thay đổi thông tin khi đơn hàng đang ở trạng thái <strong>Chờ xác nhận</strong>.
                                </div>
                                <div className="form-group mb-3">
                                    <label className="font-weight-bold small">Tên người nhận</label>
                                    <input type="text" className="form-control" value={editInfoForm.customerName} onChange={e => setEditInfoForm(f => ({ ...f, customerName: e.target.value }))} required />
                                </div>
                                <div className="form-group mb-3">
                                    <label className="font-weight-bold small">Số điện thoại</label>
                                    <input type="text" className="form-control" value={editInfoForm.phoneNumber} onChange={e => setEditInfoForm(f => ({ ...f, phoneNumber: e.target.value }))} required />
                                </div>
                                <div className="form-group mb-3">
                                    <label className="font-weight-bold small">Địa chỉ nhận hàng chi tiết</label>
                                    <textarea className="form-control" rows="3" value={editInfoForm.shippingAddress} onChange={e => setEditInfoForm(f => ({ ...f, shippingAddress: e.target.value }))} required />
                                </div>
                            </div>
                            <div className="mo-modal-footer p-3 border-top d-flex justify-content-end" style={{ backgroundColor: '#fafdfb' }}>
                                <button type="button" className="btn btn-light mr-2 font-weight-bold" onClick={() => setShowEditInfoModal(false)}>Hủy</button>
                                <button type="submit" className="btn text-white font-weight-bold" style={{ backgroundColor: '#0d4a3b' }} disabled={isUpdatingInfo}>
                                    {isUpdatingInfo ? <><span className="spinner-border spinner-border-sm mr-2"></span> Đang lưu...</> : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ══ MODAL LÝ DO HỦY ĐƠN HÀNG ══ */}
            {showCancelModal && (
                <div className="mo-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowCancelModal(false); }}>
                    <div className="mo-modal" style={{ maxWidth: '450px' }}>
                        <div className="mo-modal-header" style={{ backgroundColor: '#fafdfb', borderBottom: '1px solid #e2f0ed' }}>
                            <h5 className="m-0 font-weight-bold text-danger">
                                <i className="fas fa-exclamation-triangle mr-2"></i>Lý do hủy đơn
                            </h5>
                            <button type="button" className="mo-modal-close btn btn-link text-dark p-0" onClick={() => setShowCancelModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={submitCancelOrder}>
                            <div className="mo-modal-body p-4">
                                <p className="text-muted small mb-3">Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng này để shop có thể phục vụ bạn tốt hơn trong lần sau nhé:</p>
                                
                                <div className="d-flex flex-column" style={{ gap: '10px' }}>
                                    {cancelReasonOptions.map((reason, idx) => (
                                        <label key={idx} className="d-flex align-items-center m-0" style={{ cursor: 'pointer' }}>
                                            <input 
                                                type="radio" 
                                                name="cancelReason" 
                                                value={reason}
                                                checked={cancelReason === reason}
                                                onChange={(e) => setCancelReason(e.target.value)}
                                                className="mr-2"
                                                style={{ accentColor: '#dc3545', width: '16px', height: '16px' }}
                                            />
                                            <span style={{ fontSize: '14px', color: '#333' }}>{reason}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Hiển thị ô nhập text nếu chọn "Khác" */}
                                {cancelReason === 'Khác' && (
                                    <textarea 
                                        className="form-control mt-3" 
                                        rows="3" 
                                        placeholder="Nhập lý do của bạn..." 
                                        value={customCancelReason} 
                                        onChange={e => setCustomCancelReason(e.target.value)} 
                                        required 
                                        style={{ borderRadius: '8px', fontSize: '13.5px' }} 
                                    />
                                )}
                            </div>
                            <div className="mo-modal-footer p-3 border-top d-flex justify-content-end" style={{ backgroundColor: '#fafdfb' }}>
                                <button type="button" className="btn btn-light mr-2 font-weight-bold" onClick={() => setShowCancelModal(false)}>Không hủy nữa</button>
                                <button type="submit" className="btn btn-danger font-weight-bold" disabled={isSubmitting || !cancelReason}>
                                    {isSubmitting ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrders;