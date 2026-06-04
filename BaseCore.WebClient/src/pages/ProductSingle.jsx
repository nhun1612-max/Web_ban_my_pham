import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'; // 🟢 ĐÃ THÊM useLocation
import { productApi, productReviewApi } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ProductSingle.css';

const ProductSingle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation(); // 🟢 ĐỂ BẮT URL CÓ CHỨA #reviews HAY KHÔNG
    const { addToCart } = useCart();
    const { user } = useAuth();

    const [product, setProduct]   = useState(null);
    const [loading, setLoading]   = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState('');
    const [allImages, setAllImages]     = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [currentPrice, setCurrentPrice]       = useState(0);
    const [currentStock, setCurrentStock]       = useState(0);
    const [activeTab, setActiveTab] = useState('description');

    const [reviews, setReviews]       = useState([]);
    const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, comment: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return '';
        if (url.includes('/embed/')) return url;
        if (url.includes('watch?v=')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return url;
    };

    const fetchProduct = async () => {
        try {
            const res  = await productApi.getById(id);
            const data = res.data;

            const safeVariants = data.variants || data.Variants || [];
            const safeProduct  = { ...data, variants: safeVariants };

            setProduct(safeProduct);
            
            const backendReviews = data.reviews || data.Reviews || data.productReviews || data.ProductReviews || [];
            setReviews(backendReviews);

            const imgs = [
                data.imageUrl || data.ImageUrl,
                ...(data.galleryImages || data.GalleryImages || []),
            ].filter(Boolean);
            setAllImages(imgs);
            setActiveImage(imgs[0] || '/images/prod-1.jpg');

            if (safeVariants.length > 0) {
                const def = safeVariants[0];
                setSelectedVariant(def);
                setCurrentPrice(def.price || def.Price || 0);
                setCurrentStock(def.stock || def.Stock || 0);
            } else {
                setCurrentPrice(data.price || data.Price || 0);
                setCurrentStock(data.stock || data.Stock || 0);
            }
        } catch (e) {
            console.error('Lỗi tải sản phẩm:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.name) {
            setReviewForm(f => ({ ...f, customerName: user.name }));
        }
    }, [user]);

    useEffect(() => { fetchProduct(); }, [id]); 

    // 🟢 HIỆU ỨNG MỚI: Tự động mở tab Đánh giá và cuộn xuống nếu đến từ link "Xem đánh giá"
    useEffect(() => {
        if (!loading && location.hash === '#reviews') {
            setActiveTab('reviews');
            // Chờ React render cái tab xong (100ms) rồi cuộn xuống mượt mà
            setTimeout(() => {
                const element = document.getElementById('reviews-section');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, [location.hash, loading]);

    const handleSelectVariant = (variant) => {
        setSelectedVariant(variant);
        setCurrentPrice(variant.price || variant.Price || 0);
        setCurrentStock(variant.stock || variant.Stock || 0);
        setQuantity(1);
    };

    const handleDecrease = () => setQuantity(q => q > 1 ? q - 1 : 1);
    const handleIncrease = () => {
        if (quantity < currentStock) setQuantity(q => q + 1);
        else alert(`Cửa hàng chỉ còn tối đa ${currentStock} sản phẩm!`);
    };
    const handleQtyChange = (e) => {
        const v = e.target.value;
        if (v === '') { setQuantity(''); return; }
        const n = parseInt(v, 10);
        if (!isNaN(n)) setQuantity(n > currentStock ? currentStock : n);
    };
    const handleQtyBlur = () => { if (!quantity || quantity < 1) setQuantity(1); };

    const buildCartItem = () => {
        const vId   = selectedVariant ? (selectedVariant.id || selectedVariant.Id) : 'default';
        const vName = selectedVariant
            ? (selectedVariant.name || selectedVariant.Name)
            : (product.volume || product.Volume || 'Tiêu chuẩn');
        return {
            ...product,
            id:             `${product.id || product.Id}-${vId}`,
            originalId:     product.id || product.Id,
            price:          currentPrice,
            stock:          currentStock,
            selectedVolume: vName,
        };
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        addToCart(buildCartItem(), quantity);
        alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    };

    const handleBuyNow = (e) => {
        e.preventDefault();
        addToCart(buildCartItem(), quantity);
        navigate('/cart');
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        const currentProductId = id || product?.id || product?.Id;

        if (!reviewForm.customerName.trim() || !reviewForm.comment.trim()) {
            alert('Vui lòng nhập tên và nội dung đánh giá!');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const newReviewPayload = {
                productId:    parseInt(currentProductId, 10),
                customerName: reviewForm.customerName,
                rating:       parseInt(reviewForm.rating, 10),
                comment:      reviewForm.comment,
                variantName:  selectedVariant?.name || selectedVariant?.Name || "Mặc định",
                userId:       user?.id || null,
                createdAt:    new Date().toISOString()
            };

            await productReviewApi.create(newReviewPayload);
            alert('🎉 Cảm ơn bạn đã gửi đánh giá!');
            
            setReviews(prev => [newReviewPayload, ...prev]);
            setReviewForm(f => ({ ...f, rating: 5, comment: '' }));
            setActiveTab('reviews');
        } catch (err) {
            console.error("Lỗi gửi đánh giá:", err);
            alert('Lỗi khi gửi đánh giá: ' + (err.response?.data?.message || 'Vui lòng thử lại'));
        } finally {
            setIsSubmitting(false);
        }
    };
    const renderStars = (rating, interactive = false) =>
        [1, 2, 3, 4, 5].map(star => (
            <i
                key={star}
                className={`${star <= rating ? 'fas' : 'far'} fa-star${interactive ? ' ps-star' : ''}`}
                style={interactive ? { cursor: 'pointer' } : {}}
                onClick={interactive ? () => setReviewForm(f => ({ ...f, rating: star })) : undefined}
            />
        ));

    if (loading) return (
        <div className="ps-loading">
            <div className="ps-spinner"></div>
            <span style={{ fontSize: 14, color: '#888' }}>Đang tải sản phẩm...</span>
        </div>
    );

    if (!product) return (
        <div className="text-center py-5 mt-5">
            <i className="fas fa-box-open fa-3x text-muted mb-3 d-block"></i>
            <h4>Không tìm thấy sản phẩm này!</h4>
            <Link to="/products" className="btn btn-sm mt-3" style={{ background: '#8B1A1A', color: '#fff', borderRadius: 8 }}>
                Quay lại danh sách
            </Link>
        </div>
    );

    const productName = product.name || product.Name;
    const realAvgRating = reviews && reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || r.Rating || 0), 0) / reviews.length).toFixed(1)
        : '0.0';

    const realSoldQuantity = product.soldQuantity || product.SoldQuantity || 0;

    



    return (
        <div className="ps-page">
            <div className="ps-breadcrumb">
                <div className="container">
                    <Link to="/">Trang chủ</Link>
                    <span className="sep"><i className="fas fa-chevron-right" style={{ fontSize: 9 }}></i></span>
                    <Link to="/products">Sản phẩm</Link>
                    <span className="sep"><i className="fas fa-chevron-right" style={{ fontSize: 9 }}></i></span>
                    <span className="current">{productName}</span>
                </div>
            </div>

            <div className="container mt-4">
                <div className="ps-card">
                    <div className="row">
                        <div className="col-lg-5 mb-4 mb-lg-0">
                            <div className="ps-main-img-wrap">
                                {(product.brand || product.Brand) && (
                                    <span className="ps-brand-badge">{product.brand || product.Brand}</span>
                                )}
                                <img src={activeImage} alt={productName} onError={e => { e.target.src = '/images/prod-1.jpg'; }} />
                            </div>
                            {allImages.length > 1 && (
                                <div className="ps-thumbs mt-3">
                                    {allImages.map((img, idx) => (
                                        <div key={idx} className={`ps-thumb ${activeImage === img ? 'active' : ''}`} onClick={() => setActiveImage(img)}>
                                            <img src={img} alt={`thumb-${idx}`} onError={e => { e.target.style.display = 'none'; }} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="col-lg-7 pl-lg-5">
                            <h1 className="ps-name">{productName}</h1>
                            <div className="ps-rating">
                                        <span className="ps-rating-num">{realAvgRating}</span>
                                        <span className="ps-stars">{renderStars(Math.round(parseFloat(realAvgRating)))}</span>
                                        <button className="ps-review-link" onClick={() => setActiveTab('reviews')}>
                                            {reviews.length} đánh giá
                                        </button>
                                        
                                        {/* HIỂN THỊ SỐ LƯỢNG ĐÃ BÁN THỰC TẾ */}
                                        <span className="ps-sold" style={{ marginLeft: '15px', color: '#666', fontSize: '14px' }}>
                                            Đã bán: {realSoldQuantity}
                                        </span>
                                    </div>
                                                        <div className="ps-price">{currentPrice.toLocaleString('vi-VN')} đ</div>

                            {(product.brand || product.origin || product.skinType || product.formulation) && (
                                <div className="ps-attrs">
                                    {(product.brand  || product.Brand) && <><span className="ps-attr-label">Thương hiệu</span><span className="ps-attr-val">{product.brand || product.Brand}</span></>}
                                    {(product.origin || product.Origin) && <><span className="ps-attr-label">Xuất xứ</span><span className="ps-attr-val">{product.origin || product.Origin}</span></>}
                                    {(product.skinType || product.SkinType) && <><span className="ps-attr-label">Loại da</span><span className="ps-attr-val" style={{ color: '#16a34a' }}>{product.skinType || product.SkinType}</span></>}
                                    {(product.formulation|| product.Formulation) && <><span className="ps-attr-label">Kết cấu</span><span className="ps-attr-val" style={{ color: '#1565c0' }}>{product.formulation || product.Formulation}</span></>}
                                </div>
                            )}

                            {product.variants?.length > 0 && (
                                <div className="mb-4">
                                    <div className="ps-variant-label">Chọn phân loại: <span>{selectedVariant?.name || selectedVariant?.Name}</span></div>
                                    <div className="ps-variants">
                                        {product.variants.map(v => {
                                            const vId = v.id || v.Id;
                                            const isSelected = (selectedVariant?.id || selectedVariant?.Id) === vId;
                                            return (
                                                <button key={vId} className={`ps-variant-btn ${isSelected ? 'selected' : ''}`} onClick={() => handleSelectVariant(v)} type="button">
                                                    {v.name || v.Name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <hr className="ps-divider" />
                            <div className="ps-qty-wrap">
                                <div className="ps-qty">
                                    <button className="ps-qty-btn" type="button" onClick={handleDecrease}><i className="fas fa-minus" style={{ fontSize: 12 }}></i></button>
                                    <input type="text" className="ps-qty-input" value={quantity} onChange={handleQtyChange} onBlur={handleQtyBlur} />
                                    <button className="ps-qty-btn" type="button" onClick={handleIncrease}><i className="fas fa-plus" style={{ fontSize: 12 }}></i></button>
                                </div>
                                <span className={`ps-stock ${currentStock > 0 ? 'in-stock' : 'out-stock'}`}>
                                    <i className={`fas fa-${currentStock > 0 ? 'check-circle' : 'times-circle'} mr-1`}></i>
                                    {currentStock > 0 ? `Còn hàng (${currentStock})` : 'Hết hàng'}
                                </span>
                            </div>

                            <div className="ps-actions">
                                <button className="ps-btn-cart" onClick={handleAddToCart} disabled={currentStock <= 0}><i className="fas fa-cart-plus"></i> Thêm giỏ hàng</button>
                                <button className="ps-btn-buy" onClick={handleBuyNow} disabled={currentStock <= 0}><i className="fas fa-bolt"></i> Mua ngay</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🟢 ĐÃ THÊM id="reviews-section" VÀO ĐÂY ĐỂ TRÌNH DUYỆT TỰ ĐỘNG CUỘN XUỐNG */}
                <div className="ps-card" id="reviews-section">
                    <div className="ps-tabs">
                        {[
                            { key: 'description', label: 'Mô tả sản phẩm' },
                            { key: 'usage',       label: 'Hướng dẫn sử dụng' },
                            { key: 'reviews',     label: `Đánh giá (${reviews.length})` },
                        ].map(t => (
                            <button key={t.key} className={`ps-tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
                        ))}
                    </div>

                    {activeTab === 'description' && (
                        <div>
                            <h2 className="ps-desc-title">Thông tin chi tiết</h2>
                            <div className="ps-desc-body">
                                {(product.description || product.Description) ? (product.description || product.Description) : 'Sản phẩm chính hãng với công thức vượt trội.'}
                            </div>
                        </div>
                    )}

                    {activeTab === 'usage' && (
                        <div className="row">
                            <div className="col-md-6 mb-4 mb-md-0">
                                <h2 className="ps-desc-title">Cách dùng chuẩn</h2>
                                <ul className="ps-usage-steps">
                                    {[
                                        'Làm sạch da với nước tẩy trang và sữa rửa mặt.',
                                        'Lấy một lượng vừa đủ ra tay.',
                                        'Chấm đều lên 5 điểm trên mặt (trán, mũi, cằm, 2 má).',
                                        'Massage nhẹ nhàng từ dưới lên trên, từ trong ra ngoài.',
                                    ].map((step, i) => (
                                        <li key={i}>
                                            <span className="ps-step-num">{i + 1}</span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="col-md-6">
                                <h2 className="ps-desc-title">Video hướng dẫn</h2>
                                <div className="ps-video-wrap">
                                    {(product.videoUrl || product.VideoUrl) ? (
                                        <iframe
                                            width="100%" height="260"
                                            src={getYouTubeEmbedUrl(product.videoUrl || product.VideoUrl)}
                                            title="Video hướng dẫn"
                                            frameBorder="0" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <div className="ps-no-video">
                                            <i className="fas fa-video fa-2x"></i>
                                            <span>Chưa có video hướng dẫn</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="row">
                            <div className="col-md-7 mb-4 mb-md-0">
                                <h2 className="ps-desc-title">Đánh giá từ khách hàng</h2>
                                {!reviews || reviews.length === 0 ? (
                                    <div className="ps-no-review" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                                        <i className="far fa-comment-dots fa-2x mb-3 d-block text-muted"></i>
                                        Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!
                                    </div>
                                ) : (
                                    <div className="ps-review-container" style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '5px' }}>
                                        {reviews.map((r, idx) => {
                                            const rName   = r.customerName || r.CustomerName || "Khách hàng";
                                            const rRating = r.rating       || r.Rating || 5;
                                            const rText   = r.comment      || r.Comment || "";
                                            const rDate   = r.createdAt    || r.CreatedAt || new Date();
                                            
                                            return (
                                                <div key={idx} className="ps-review-item d-flex p-3 mb-3 bg-white rounded border shadow-sm" style={{ gap: '15px' }}>
                                                    <div className="ps-review-avatar d-flex align-items-center justify-content-center text-white rounded-circle font-weight-bold" 
                                                         style={{ width: '40px', height: '40px', minWidth: '40px', backgroundColor: '#880e4f', fontSize: '16px' }}>
                                                        {rName ? rName.charAt(0).toUpperCase() : "K"}
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="ps-review-name d-flex justify-content-between align-items-center mb-1">
                                                            <span className="font-weight-bold text-dark">{rName}</span>
                                                            <span className="ps-review-date text-muted small">{new Date(rDate).toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                        <div className="ps-review-stars mb-2" style={{ color: '#ffc107', fontSize: '12px' }}>
                                                            {renderStars(rRating)}
                                                        </div>
                                                        <div className="ps-review-text text-secondary" style={{ fontSize: '13px', lineHeight: '1.5' }}>{rText}</div>
                                                        {r.images && r.images.length > 0 && (
                                                <div className="d-flex flex-wrap mt-2" style={{ gap: '8px' }}>
                                                    {r.images.map((imgUrl, imgIdx) => (
                                                        <img 
                                                            key={imgIdx} 
                                                            // Thêm gốc localhost:5001 nếu URL lưu dạng tương đối
                                                            src={imgUrl.startsWith('http') ? imgUrl : `http://localhost:5001${imgUrl}`} 
                                                            alt="Đánh giá thực tế" 
                                                            className="rounded border shadow-sm" 
                                                            style={{ width: '70px', height: '70px', objectFit: 'cover', cursor: 'pointer' }} 
                                                            onClick={() => window.open(imgUrl.startsWith('http') ? imgUrl : `http://localhost:5001${imgUrl}`, '_blank')}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                             </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="col-md-5">
                                <form className="ps-review-form p-3 border rounded bg-light shadow-sm" onSubmit={handleSubmitReview}>
                                    <h5 className="font-weight-bold mb-3" style={{ color: '#880e4f' }}>Viết đánh giá của bạn</h5>
                                    <div className="form-group mb-3">
                                        <input type="text" className="form-control" placeholder="Tên của bạn *" value={reviewForm.customerName} onChange={e => setReviewForm(f => ({ ...f, customerName: e.target.value }))} required />
                                    </div>
                                    <div className="mb-3">
                                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, display: 'block' }}>Chất lượng:</label>
                                        <div className="ps-star-picker" style={{ color: '#ffc107', fontSize: '1.5rem', gap: '5px', display: 'flex' }}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <i key={star} className={`${star <= reviewForm.rating ? 'fas' : 'far'} fa-star`} style={{ cursor: 'pointer' }} onClick={() => setReviewForm(f => ({ ...f, rating: star }))} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="form-group mb-3">
                                        <textarea className="form-control" rows="4" placeholder="Cảm nhận của bạn về sản phẩm... *" value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} required />
                                    </div>
                                    <button type="submit" className="btn btn-block font-weight-bold text-white" disabled={isSubmitting} style={{ backgroundColor: '#d81b60', borderRadius: '6px' }}>
                                        {isSubmitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Đang gửi...</> : <><i className="fas fa-paper-plane mr-2"></i>Gửi đánh giá</>}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductSingle;