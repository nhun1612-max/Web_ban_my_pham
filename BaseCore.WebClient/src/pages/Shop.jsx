import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi, categoryApi } from '../services/api';

const Shop = () => {
    // 1. Khai báo các State cần thiết
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // State cho các bộ lọc
    const [filterCategory, setFilterCategory] = useState('all'); 
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedSkinTypes, setSelectedSkinTypes] = useState([]);

    // 2. Gọi API khi vừa vào trang
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [prodRes, catRes] = await Promise.all([
                    productApi.getAll(),
                    categoryApi.getAll()
                ]);

                const productsData = prodRes.data?.items || prodRes.data || [];
                const categoriesData = catRes.data?.items || catRes.data || [];

                setProducts(productsData);
                setCategories(categoriesData);
            } catch (error) {
                console.error("Lỗi tải dữ liệu Cửa hàng:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 3. Trích xuất tự động danh sách Thương hiệu và Loại da từ dữ liệu sản phẩm
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    const uniqueSkinTypes = [...new Set(products.map(p => p.skinType).filter(Boolean))];

    // 4. Logic Xử lý click checkbox bộ lọc
    const handleBrandToggle = (brand) => {
        setSelectedBrands(prev => 
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );
    };

    const handleSkinTypeToggle = (skinType) => {
        setSelectedSkinTypes(prev => 
            prev.includes(skinType) ? prev.filter(s => s !== skinType) : [...prev, skinType]
        );
    };

    // 5. Logic Lọc Sản Phẩm nhiều lớp
    let displayedProducts = products;
    
    if (filterCategory !== 'all') {
        displayedProducts = displayedProducts.filter(p => p.categoryId === filterCategory);
    }
    if (selectedBrands.length > 0) {
        displayedProducts = displayedProducts.filter(p => selectedBrands.includes(p.brand));
    }
    if (selectedSkinTypes.length > 0) {
        displayedProducts = displayedProducts.filter(p => selectedSkinTypes.includes(p.skinType));
    }

    return (
        <div style={{ backgroundColor: '#fdfbfb', minHeight: '100vh' }}>
            {/* Banner Tiêu đề Trang (Tone màu hồng/nude thanh lịch cho Mỹ phẩm) */}
            <div className="py-5 text-center" style={{ backgroundColor: '#fce4ec', color: '#880e4f', borderBottom: '1px solid #f8bbd0' }}>
                <h1 className="font-weight-bold" style={{ letterSpacing: '2px', fontFamily: '"Playfair Display", serif' }}>
                    MỸ PHẨM CHÍNH HÃNG
                </h1>
                <p className="text-muted" style={{ fontSize: '1.1rem' }}>Đánh thức vẻ đẹp tự nhiên của bạn với bộ sưu tập cao cấp</p>
            </div>

            <div className="container mt-5 mb-5">
                <div className="row">
                    
                    {/* ── CỘT TRÁI: BỘ LỌC (SIDEBAR) ── */}
                    <div className="col-lg-3 mb-4">
                        
                        {/* 1. Lọc theo Danh mục */}
                        <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                            <div className="card-header font-weight-bold" style={{ backgroundColor: '#f8bbd0', color: '#880e4f', border: 'none' }}>
                                <i className="fa fa-list mr-2"></i> DANH MỤC
                            </div>
                            <ul className="list-group list-group-flush">
                                <li 
                                    className={`list-group-item d-flex justify-content-between align-items-center ${filterCategory === 'all' ? 'font-weight-bold' : ''}`}
                                    style={{ cursor: 'pointer', color: filterCategory === 'all' ? '#d81b60' : '#555', backgroundColor: filterCategory === 'all' ? '#fce4ec' : '#fff' }}
                                    onClick={() => setFilterCategory('all')}
                                >
                                    Tất cả sản phẩm
                                    <span className="badge badge-pill" style={{ backgroundColor: filterCategory === 'all' ? '#d81b60' : '#eee', color: filterCategory === 'all' ? '#fff' : '#555' }}>
                                        {products.length}
                                    </span>
                                </li>
                                {categories.map(cat => {
                                    const count = products.filter(p => p.categoryId === cat.id).length;
                                    return (
                                        <li 
                                            key={cat.id}
                                            className={`list-group-item d-flex justify-content-between align-items-center ${filterCategory === cat.id ? 'font-weight-bold' : ''}`}
                                            style={{ cursor: 'pointer', color: filterCategory === cat.id ? '#d81b60' : '#555', backgroundColor: filterCategory === cat.id ? '#fce4ec' : '#fff' }}
                                            onClick={() => setFilterCategory(cat.id)}
                                        >
                                            {cat.name}
                                            <span className="badge badge-pill" style={{ backgroundColor: filterCategory === cat.id ? '#d81b60' : '#eee', color: filterCategory === cat.id ? '#fff' : '#555' }}>
                                                {count}
                                            </span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>

                        {/* 2. Lọc theo Thương hiệu */}
                        {uniqueBrands.length > 0 && (
                            <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                <div className="card-header font-weight-bold" style={{ backgroundColor: '#f8bbd0', color: '#880e4f', border: 'none' }}>
                                    <i className="fa fa-gem mr-2"></i> THƯƠNG HIỆU
                                </div>
                                <div className="card-body p-3">
                                    {uniqueBrands.map((brand, idx) => (
                                        <div className="custom-control custom-checkbox mb-2" key={idx}>
                                            <input 
                                                type="checkbox" 
                                                className="custom-control-input" 
                                                id={`brand-${idx}`}
                                                checked={selectedBrands.includes(brand)}
                                                onChange={() => handleBrandToggle(brand)}
                                            />
                                            <label className="custom-control-label text-muted" htmlFor={`brand-${idx}`} style={{ cursor: 'pointer' }}>
                                                {brand}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Lọc theo Loại da */}
                        {uniqueSkinTypes.length > 0 && (
                            <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                <div className="card-header font-weight-bold" style={{ backgroundColor: '#f8bbd0', color: '#880e4f', border: 'none' }}>
                                    <i className="fa fa-leaf mr-2"></i> LOẠI DA PHÙ HỢP
                                </div>
                                <div className="card-body p-3">
                                    {uniqueSkinTypes.map((skin, idx) => (
                                        <div className="custom-control custom-checkbox mb-2" key={idx}>
                                            <input 
                                                type="checkbox" 
                                                className="custom-control-input" 
                                                id={`skin-${idx}`}
                                                checked={selectedSkinTypes.includes(skin)}
                                                onChange={() => handleSkinTypeToggle(skin)}
                                            />
                                            <label className="custom-control-label text-muted" htmlFor={`skin-${idx}`} style={{ cursor: 'pointer' }}>
                                                {skin}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* ── CỘT PHẢI: LƯỚI SẢN PHẨM ── */}
                    <div className="col-lg-9">
                        
                        {/* Thanh trạng thái */}
                        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                            <span className="text-muted">
                                Đang hiển thị <strong className="text-dark">{displayedProducts.length}</strong> sản phẩm
                            </span>
                        </div>

                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" style={{ color: '#d81b60' }} role="status"></div>
                                <p className="mt-3 text-muted">Đang tải sản phẩm...</p>
                            </div>
                        ) : (
                            <div className="row">
                                {displayedProducts.length === 0 ? (
                                    <div className="col-12 text-center py-5">
                                        <i className="fa fa-box-open fa-3x text-muted mb-3" style={{ opacity: 0.5 }}></i>
                                        <h5 className="text-muted">Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</h5>
                                        <button className="btn btn-sm btn-outline-secondary mt-2" onClick={() => { setSelectedBrands([]); setSelectedSkinTypes([]); setFilterCategory('all'); }}>
                                            Xóa bộ lọc
                                        </button>
                                    </div>
                                ) : (
                                    displayedProducts.map(product => (
                                        <div className="col-md-4 mb-4" key={product.id}>
                                            <div className="card h-100 shadow-sm border-0 product-card" style={{ borderRadius: '12px', transition: 'all 0.3s ease', overflow: 'hidden' }}>
                                                
                                                {/* Nhãn Thương hiệu lอย nổi trên ảnh */}
                                                {product.brand && (
                                                    <span className="badge position-absolute" style={{ top: '10px', left: '10px', zIndex: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#d81b60', border: '1px solid #f8bbd0' }}>
                                                        {product.brand}
                                                    </span>
                                                )}

                                                <Link to={`/product/${product.id}`} style={{ overflow: 'hidden' }}>
                                                    <img
                                                        src={product.imageUrl || `/images/prod-1.jpg`}
                                                        className="card-img-top"
                                                        alt={product.name}
                                                        style={{ height: '250px', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                                    />
                                                </Link>
                                                
                                                <div className="card-body d-flex flex-column text-center">
                                                    <Link to={`/product/${product.id}`} className="text-dark text-decoration-none">
                                                        <h6 className="card-title font-weight-bold text-truncate" title={product.name} style={{ fontSize: '1rem' }}>
                                                            {product.name}
                                                        </h6>
                                                    </Link>

                                                    {/* Thông số phụ (Dung tích & Loại da) */}
                                                    <div className="text-muted small mb-2 d-flex justify-content-center gap-2" style={{ gap: '10px' }}>
                                                        {product.volume && <span><i className="fa fa-tint text-info mr-1"></i>{product.volume}</span>}
                                                        {product.skinType && <span><i className="fa fa-leaf text-success mr-1"></i>{product.skinType}</span>}
                                                    </div>

                                                    <p className="card-text font-weight-bold mb-3" style={{ color: '#d81b60', fontSize: '1.2rem' }}>
                                                        {product.price?.toLocaleString('vi-VN')} đ
                                                    </p>
                                                    
                                                    {/* Nút thêm vào giỏ */}
                                                    <button className="btn mt-auto font-weight-bold" style={{ backgroundColor: '#d81b60', color: '#fff', borderRadius: '8px' }}>
                                                        <i className="fa fa-shopping-bag mr-2"></i> Thêm vào giỏ
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Shop;