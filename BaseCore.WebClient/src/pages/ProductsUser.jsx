import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productApi, categoryApi } from '../services/api';
import { useCart } from '../contexts/CartContext';

const ProductsUser = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const initialKeyword = searchParams.get('search') || '';
    
    // --- STATE CHO BỘ LỌC (BACKEND QUERY) ---
    const [filters, setFilters] = useState({
        keyword: initialKeyword,
        categoryId: '',
        minPrice: '',
        maxPrice: '',
        brand: '',       
        skinType: '',    
        sortBy: 'default',
        page: 1,
        pageSize: 9 
    });
    
    const [totalPages, setTotalPages] = useState(0);
    const { addToCart } = useCart();

    useEffect(() => {
        const currentSearch = searchParams.get('search') || '';
        setFilters(prev => ({ ...prev, keyword: currentSearch, page: 1 }));
    }, [searchParams]);

    // 1. Load Categories
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const catRes = await categoryApi.getAll();
                setCategories(catRes.data || []);
            } catch (error) {
                console.error("Lỗi khi tải danh mục:", error);
            }
        };
        loadCategories();
    }, []);

    // 2. Load Products
    useEffect(() => {
        const loadProductsFromBackend = async () => {
            setLoading(true);
            try {
                const cleanFilters = {
                    ...filters,
                    minPrice: filters.minPrice || null,
                    maxPrice: filters.maxPrice || null,
                    brand: filters.brand || null,          
                    skinType: filters.skinType || null,    
                    sortBy: filters.sortBy === 'default' ? null : filters.sortBy
                };

                const response = await productApi.search(cleanFilters);
                setProducts(response.data.items || []); 
                setTotalPages(response.data.totalPages || 0);
            } catch (error) {
                console.error("Lỗi truy vấn:", error);
            } finally {
                setLoading(false);
            }
        };
        loadProductsFromBackend();
    }, [filters]);

    // 3. Tự động trích xuất Thương hiệu & Loại da
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    const uniqueSkinTypes = [...new Set(products.map(p => p.skinType).filter(Boolean))];

    // 4. Các hàm xử lý sự kiện
    const handleSearchChange = (e) => {
        setFilters({ ...filters, keyword: e.target.value, page: 1 });
    };

    const handleSortChange = (e) => {
        setFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }));
    };

    const handleCategoryClick = (id) => {
        setFilters(prev => ({ ...prev, categoryId: id === 'all' ? '' : id, page: 1 }));
    };

    const handleBrandClick = (brandName) => {
        setFilters(prev => ({ ...prev, brand: prev.brand === brandName ? '' : brandName, page: 1 }));
    };

    const handleSkinTypeClick = (skinName) => {
        setFilters(prev => ({ ...prev, skinType: prev.skinType === skinName ? '' : skinName, page: 1 }));
    };

    return (
        <div style={{ backgroundColor: '#f4f6f4', minHeight: '100vh', paddingBottom: '50px' }}>
            
            {/* ── 🟢 BANNER ĐÃ ĐỔI SANG MÀU XANH RÊU THIÊN NHIÊN CAO CẤP (TƯƠNG PHẢN ĐỈNH) ── */}
            <div className="py-5 text-center" style={{ backgroundColor: '#0d4a3b', color: '#ffffff', boxShadow: '0 4px 15px rgba(229, 237, 235, 0.81)' }}>
                <h1 className="font-weight-bold mb-2" style={{ letterSpacing: '3px', fontFamily: '"Playfair Display", serif', fontSize: '2.4rem', textShadow: '1px 1px 2px rgba(231, 236, 242, 0.83)' }}>
                    <i className="fa fa-spa mr-3" style={{ color: '#a3e635' }}></i>MỸ PHẨM THUẦN CHAY CAO CẤP
                </h1>
                <p className="breadcrumbs mb-0" style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                    <span className="mr-2">
                        <Link to="/" style={{ color: '#a3e635', fontWeight: 500, textDecoration: 'none' }}>
                            Trang chủ <i className="fa fa-chevron-right mx-1" style={{ fontSize: 9 }} />
                        </Link>
                    </span> 
                    <span className="text-white">Sản phẩm <i className="fa fa-chevron-right mx-1" style={{ fontSize: 9 }} /></span>
                </p>
            </div>

            <section className="container mt-5">
                <div className="row">
                    
                    {/* ── CỘT TRÁI: DANH SÁCH SẢN PHẨM ── */}
                    <div className="col-md-9 order-2 order-md-1">
                        
                        {/* Thanh công cụ Tìm kiếm & Sắp xếp */}
                        <div className="row mb-4 align-items-center bg-white p-3 shadow-sm" style={{ borderRadius: '16px', margin: '0 2px', borderLeft: '5px solid #0d4a3b' }}>
                            <div className="col-md-6 d-flex align-items-center mb-3 mb-md-0">
                                <span className="mr-3 font-weight-bold" style={{ color: '#2b2b2b' }}>Sắp xếp:</span>
                                <select 
                                    className="form-control form-control-sm font-weight-bold" 
                                    style={{ width: '160px', borderRadius: '8px', borderColor: '#0d4a3b', color: '#0d4a3b', backgroundColor: '#fcfdfe' }}
                                    onChange={handleSortChange}
                                    value={filters.sortBy}
                                >
                                    <option value="default">✨ Mới nhất</option>
                                    <option value="price_asc">💵 Giá tăng dần</option>
                                    <option value="price_desc">📈 Giá giảm dần</option>
                                </select>
                            </div>

                            <div className="col-md-6">
                                <div className="input-group shadow-sm" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                                    <input 
                                        type="text" 
                                        className="form-control border-right-0" 
                                        placeholder="Tìm tên sản phẩm tự nhiên..." 
                                        value={filters.keyword}
                                        onChange={handleSearchChange}
                                        style={{ paddingLeft: '20px', borderColor: '#0d4a3b', height: '42px', fontSize: '14px', color: '#2b2b2b' }}
                                    />
                                    <div className="input-group-append">
                                        <button className="btn text-white px-4" style={{ backgroundColor: '#0d4a3b', borderColor: '#0d4a3b' }}>
                                            <i className="fa fa-search"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lưới Sản phẩm */}
                        <div className="row">
                            {loading ? (
                                <div className="col-12 text-center py-5">
                                    <div className="spinner-border" style={{ color: '#0d4a3b' }}></div>
                                    <p className="mt-3 font-weight-bold text-muted">Đang tìm kiếm sản phẩm thuần chay...</p>
                                </div>
                            ) : products.length > 0 ? (
                                products.map((product, index) => (
                                    <div className="col-md-4 mb-4" key={product.id}>
                                        <div className="card h-100 shadow-sm border-0 product-card" 
                                             style={{ borderRadius: '16px', transition: 'all 0.3s ease', overflow: 'hidden', backgroundColor: '#ffffff' }}
                                             onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}
                                             onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
                                        >
                                            {/* Nhãn Thương hiệu lơ lửng góc trái */}
                                            {product.brand && (
                                                <span className="badge position-absolute font-weight-bold px-2 py-1" 
                                                      style={{ top: '12px', left: '12px', zIndex: 1, backgroundColor: '#e2f0ed', color: '#0d4a3b', borderRadius: '6px', fontSize: '11px' }}>
                                                    🌿 {product.brand}
                                                </span>
                                            )}

                                            <Link to={`/product/${product.id}`} style={{ overflow: 'hidden', backgroundColor: '#fcfdfc', display: 'block' }}>
                                                <img
                                                    src={product.imageUrl || `/images/prod-${(index % 12) + 1}.jpg`}
                                                    className="card-img-top"
                                                    alt={product.name}
                                                    style={{ height: '220px', objectFit: 'contain', transition: 'transform 0.4s ease', padding: '15px' }}
                                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.06)'}
                                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                                />
                                            </Link>
                                            
                                            <div className="card-body d-flex flex-column text-center pt-3 px-3 pb-3">
                                                <Link to={`/product/${product.id}`} className="text-decoration-none">
                                                    <h6 className="card-title font-weight-bold text-truncate mb-2" title={product.name} style={{ fontSize: '1.05rem', color: '#1a1a1a', lineHeight: '1.4' }}>
                                                        {product.name}
                                                    </h6>
                                                </Link>

                                                {/* ── 🟢 KHỐI TAG MỸ PHẨM ĐƯỢC ĐÓNG BOX ĐẬM NÉT (TƯƠNG PHẢN ĐẸP) ── */}
                                                <div className="d-flex justify-content-center flex-wrap mb-3" style={{ gap: '6px' }}>
                                                    {product.volume && (
                                                        <span className="px-2 py-1 rounded-pill font-weight-bold" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px' }}>
                                                            <i className="fa fa-tint mr-1"></i>{product.volume}
                                                        </span>
                                                    )}
                                                    {product.skinType && (
                                                        <span className="px-2 py-1 rounded-pill font-weight-bold" style={{ backgroundColor: '#f0fdf4', color: '#166534', fontSize: '11px' }}>
                                                            <i className="fa fa-leaf mr-1"></i>{product.skinType}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Giá màu đỏ đậm nổi bật */}
                                                <p className="card-text font-weight-bold mb-3 mt-auto" style={{ color: '#880e4f', fontSize: '1.25rem', letterSpacing: '0.5px' }}>
                                                    {product.price?.toLocaleString('vi-VN')} đ
                                                </p>
                                                
                                                {/* Nút thêm vào giỏ màu nhấn cao cấp */}
                                                <button 
                                                    className="btn mt-auto font-weight-bold w-100 py-2 btn-cart shadow-sm" 
                                                    style={{ backgroundColor: '#084838', color: '#ffffff', borderRadius: '10px', fontSize: '13px', transition: 'all 0.2s', border: 'none' }}
                                                    onClick={(e) => { e.preventDefault(); addToCart(product, 1); }}
                                                    onMouseEnter={e => e.target.style.backgroundColor = '#0a554b'}
                                                    onMouseLeave={e => e.target.style.backgroundColor = '#084838'}
                                                >
                                                    <i className="fa fa-cart-plus mr-2"></i> THÊM VÀO GIỎ HÀNG
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12 text-center py-5 bg-white shadow-sm rounded" style={{ borderRadius: '16px' }}>
                                    <i className="fa fa-box-open fa-3x mb-3 text-muted" style={{ opacity: 0.4 }}></i>
                                    <h5 className="text-dark font-weight-bold">Không tìm thấy sản phẩm nào phù hợp.</h5>
                                    <button className="btn text-white mt-3 px-4 font-weight-bold" style={{ backgroundColor: '#0d4a3b', borderRadius: '8px' }}
                                            onClick={() => setFilters({...filters, brand: '', skinType: '', categoryId: '', minPrice: '', maxPrice: '', keyword: ''})}>
                                        Xóa bộ lọc hành trình
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* PHÂN TRANG (PAGINATION) */}
                        {!loading && totalPages > 1 && (
                            <div className="row mt-4 mb-5">
                                <div className="col text-center">
                                    <ul className="pagination justify-content-center shadow-sm d-inline-flex" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <li key={i + 1} className={`page-item ${filters.page === i + 1 ? 'active' : ''}`}>
                                                <a 
                                                    href="#" 
                                                    className="page-link font-weight-bold px-3 py-2 border-0" 
                                                    onClick={(e) => { e.preventDefault(); setFilters({...filters, page: i + 1}); window.scrollTo(0,0); }}
                                                    style={{ 
                                                        backgroundColor: filters.page === i + 1 ? '#0d4a3b' : '#fff',
                                                        color: filters.page === i + 1 ? '#fff' : '#0d4a3b',
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    {i + 1}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── CỘT PHẢI: SIDEBAR LỌC (ĐÃ TĂNG ĐỘ TƯƠNG PHẢN ĐẬM ĐÀ) ── */}
                    <div className="col-md-3 order-1 order-md-2 mb-4">
                        <div className="sidebar-box shadow-sm p-4" style={{ borderRadius: '16px', backgroundColor: '#ffffff', borderTop: '5px solid #0d4a3b' }}>
                            
                            {/* 1. Lọc theo Danh mục */}
                            <div className="mb-4">
                                <h5 className="font-weight-bold mb-3 pb-2" style={{ fontSize: '14px', color: '#0d4a3b', borderBottom: '2px solid #e2f0ed', letterSpacing: '1px' }}>
                                    DANH MỤC SẢN PHẨM
                                </h5>
                                <ul className="list-unstyled mb-0" style={{ fontSize: '14.5px' }}>
                                    <li className="mb-2">
                                        <a href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick('all'); }} 
                                           style={{ color: filters.categoryId === '' ? '#880e4f' : '#2b2b2b', fontWeight: filters.categoryId === '' ? 'bold' : '500', textDecoration: 'none', display: 'block', padding: '4px 0' }}>
                                            <i className={`fas fa-chevron-right mr-2`} style={{ fontSize: '11px', color: filters.categoryId === '' ? '#880e4f' : '#888' }}></i> Tất cả sản phẩm
                                        </a>
                                    </li>
                                    {categories.map(cat => (
                                        <li key={cat.id} className="mb-2">
                                            <a href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(cat.id); }} 
                                               style={{ color: filters.categoryId === cat.id ? '#880e4f' : '#2b2b2b', fontWeight: filters.categoryId === cat.id ? 'bold' : '500', textDecoration: 'none', display: 'block', padding: '4px 0' }}>
                                                <i className={`fas fa-chevron-right mr-2`} style={{ fontSize: '11px', color: filters.categoryId === cat.id ? '#880e4f' : '#888' }}></i> {cat.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* 2. Lọc theo Thương hiệu */}
                            {uniqueBrands.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="font-weight-bold mb-3 pb-2" style={{ fontSize: '14px', color: '#0d4a3b', borderBottom: '2px solid #e2f0ed', letterSpacing: '1px' }}>
                                        THƯƠNG HIỆU
                                    </h5>
                                    <div className="mt-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                        {uniqueBrands.map((brand, idx) => (
                                            <div className="custom-control custom-checkbox mb-2" key={idx}>
                                                <input 
                                                    type="checkbox" 
                                                    className="custom-control-input" 
                                                    id={`brand-${idx}`}
                                                    checked={filters.brand === brand}
                                                    onChange={() => handleBrandClick(brand)}
                                                />
                                                <label className="custom-control-label font-weight-bold" htmlFor={`brand-${idx}`} 
                                                       style={{ color: filters.brand === brand ? '#880e4f' : '#2b2b2b', cursor: 'pointer', fontSize: '13.5px' }}>
                                                    {brand}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 3. Lọc theo Loại da */}
                            {uniqueSkinTypes.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="font-weight-bold mb-3 pb-2" style={{ fontSize: '14px', color: '#0d4a3b', borderBottom: '2px solid #e2f0ed', letterSpacing: '1px' }}>
                                        LOẠI DA PHÙ HỢP
                                    </h5>
                                    <div className="mt-2">
                                        {uniqueSkinTypes.map((skin, idx) => (
                                            <div className="custom-control custom-checkbox mb-2" key={idx}>
                                                <input 
                                                    type="checkbox" 
                                                    className="custom-control-input" 
                                                    id={`skin-${idx}`}
                                                    checked={filters.skinType === skin}
                                                    onChange={() => handleSkinTypeClick(skin)}
                                                />
                                                <label className="custom-control-label font-weight-bold" htmlFor={`skin-${idx}`} 
                                                       style={{ color: filters.skinType === skin ? '#880e4f' : '#2b2b2b', cursor: 'pointer', fontSize: '13.5px' }}>
                                                    {skin}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 4. Bộ lọc Khoảng giá */}
                            <div>
                                <h5 className="font-weight-bold mb-3 pb-2" style={{ fontSize: '14px', color: '#0d4a3b', borderBottom: '2px solid #e2f0ed', letterSpacing: '1px' }}>
                                    KHOẢNG GIÁ (VNĐ)
                                </h5>
                                <div className="mt-2">
                                    <input 
                                        type="number" 
                                        className="form-control form-control-sm mb-2 font-weight-bold" 
                                        placeholder="Từ giá: 0" 
                                        value={filters.minPrice}
                                        onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                        style={{ borderColor: '#0d4a3b', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                    <input 
                                        type="number" 
                                        className="form-control form-control-sm mb-3 font-weight-bold" 
                                        placeholder="Đến giá: Tối đa" 
                                        value={filters.maxPrice}
                                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                        style={{ borderColor: '#0d4a3b', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                    <button 
                                        className="btn btn-block text-white font-weight-bold py-2 shadow-sm"
                                        onClick={() => setFilters({ ...filters, page: 1 })}
                                        style={{ backgroundColor: '#0d4a3b', borderRadius: '8px', fontSize: '13px', letterSpacing: '0.5px' }}
                                    >
                                        ÁP DỤNG LỌC GIÁ
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default ProductsUser;