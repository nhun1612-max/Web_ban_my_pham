import React, { useState, useEffect } from 'react';
import { productApi, categoryApi, supplierApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Products.css';

const EMPTY_FORM = {
    name: '', price: 0, importPrice: 0, stock: 0,
    description: '', categoryId: '', supplierId: '', expiryDate: '',
    volume: '', origin: '', brand: '', skinType: '', formulation: '',
    videoUrl: '', imageUrl: '', galleryImages: '',
    variants: [],
};

const Products = () => {
    const [products, setProducts]         = useState([]);
    const [categories, setCategories]     = useState([]);
    const [suppliers, setSuppliers]       = useState([]);
    const [loading, setLoading]           = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [filters, setFilters] = useState({
        keyword: '', categoryId: '', supplierId: '',
        maxStock: '', sortBy: 'default', page: 1, pageSize: 10,
    });
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal]   = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData]     = useState(EMPTY_FORM);
    const [error, setError]           = useState('');
    const [imgError, setImgError]     = useState({});
    const { isAdmin } = useAuth();

    /* ── Load ── */
    useEffect(() => { loadCategories(); loadSuppliers(); }, []);
    useEffect(() => {
        const t = setTimeout(() => loadProducts(), 350);
        return () => clearTimeout(t);
    }, [filters.keyword, filters.page, filters.categoryId, filters.supplierId, filters.sortBy]); // eslint-disable-line

    const loadCategories = async () => {
        try { const r = await categoryApi.getAll(); setCategories(r.data || []); } catch {}
    };
    const loadSuppliers = async () => {
        try {
            const r = await supplierApi.getAll();
            const d = Array.isArray(r.data) ? r.data : r.data?.items || r.data?.data || [];
            setSuppliers(d);
        } catch {}
    };
    const loadProducts = async () => {
        setLoading(true);
        try {
            const r    = await productApi.search(filters);
            const data = r.data?.items || r.data;
            setProducts(Array.isArray(data) ? data : []);
            setTotalPages(r.data?.totalPages || 1);
            setTotalCount(r.data?.totalCount  || (Array.isArray(data) ? data.length : 0));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    /* ── Variants ── */
    const addVariant = () =>
        setFormData(f => ({ ...f, variants: [...f.variants, { name: '', price: f.price || 0, stock: 0 }] }));

    const removeVariant = (idx) =>
        setFormData(f => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));

    const handleVariantChange = (idx, field, val) =>
        setFormData(f => {
            const v = [...f.variants];
            v[idx] = { ...v[idx], [field]: val };
            return { ...f, variants: v };
        });

    /* ── Modal ── */
    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name:         product.name,
                price:        product.price,
                importPrice:  product.importPrice  || 0,
                stock:        product.stock,
                description:  product.description  || '',
                categoryId:   product.categoryId,
                supplierId:   product.supplierId   || '',
                expiryDate:   product.expiryDate   ? product.expiryDate.split('T')[0] : '',
                volume:       product.volume       || '',
                origin:       product.origin       || '',
                brand:        product.brand        || '',
                skinType:     product.skinType     || '',
                formulation:  product.formulation  || '',
                videoUrl:     product.videoUrl     || '',
                imageUrl:     product.imageUrl     || '',
                galleryImages: Array.isArray(product.galleryImages)
                                ? product.galleryImages.join(', ')
                                : product.galleryImages || '',
                variants:     product.variants     || [],
            });
        } else {
            setEditingProduct(null);
            setFormData({ ...EMPTY_FORM, categoryId: categories[0]?.id || categories[0]?.Id || '' });
        }
        setError('');
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setEditingProduct(null); };

   const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        try {
            // Lọc và ép kiểu mảng phân loại
            const cleanVariants = formData.variants
                .filter(v => v.name && v.name.trim() !== '') 
                .map(v => ({
                    name:  v.name.trim(),
                    price: Number(v.price) || 0,
                    stock: Number(v.stock) || 0,
                }));

            // 🟢 TỰ ĐỘNG CỘNG TỔNG TỒN KHO TỪ CÁC PHÂN LOẠI (Nếu có)
            const totalVariantStock = cleanVariants.length > 0 
                ? cleanVariants.reduce((sum, v) => sum + v.stock, 0) 
                : (Number(formData.stock) || 0);

            const payload = {
                ...formData,
                price:       Number(formData.price)       || 0,
                importPrice: Number(formData.importPrice) || 0,
                stock:       totalVariantStock, // 🟢 Gắn tổng tồn kho vừa cộng vào đây
                variants:    cleanVariants,
                expiryDate:  formData.expiryDate && formData.expiryDate.trim() !== '' ? formData.expiryDate : null,
            };

            if (editingProduct) await productApi.update(editingProduct.id, payload);
            else                await productApi.create(payload);
            
            closeModal(); loadProducts();
            alert("Lưu sản phẩm thành công!");
        } catch (e) {
            const d = e.response?.data;
            if (d?.errors) setError('Lỗi dữ liệu: ' + Object.values(d.errors)[0][0]);
            else setError(d?.message || d?.title || 'Lỗi server! Kiểm tra Visual Studio.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xác nhận xóa sản phẩm này?')) return;
        try { await productApi.delete(id); loadProducts(); }
        catch { alert('Không thể xóa sản phẩm này.'); }
    };

    /* ── Helpers ── */
    const setF = (key, val) => setFormData(f => ({ ...f, [key]: val }));
    const profit = Number(formData.price || 0) - Number(formData.importPrice || 0);
    const hasAdv = filters.categoryId || filters.supplierId || filters.maxStock;

    const stockBadge = (qty) => {
        if (qty === 0) return <span className="badge badge-danger">Hết hàng</span>;
        if (qty <= 5)  return <span className="badge badge-warning text-dark">{qty} !</span>;
        return <span className="badge badge-success">{qty}</span>;
    };

    const renderPagination = () => {
        const pages = [];
        const start = Math.max(1, filters.page - 3);
        const end   = Math.min(totalPages, start + 6);
        for (let i = start; i <= end; i++) {
            pages.push(
                <li key={i} className={`page-item ${filters.page === i ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setFilters(f => ({ ...f, page: i }))}>{i}</button>
                </li>
            );
        }
        return pages;
    };

    /* ════════════════════════════════════════ RENDER ════════════════════════════════════════ */
    return (
        <div className="products-page">

            {/* ── HEADER ── */}
            <div className="content-header">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">
                        <h1 className="m-0 font-weight-bold" style={{ fontSize: 22 }}>
                            <i className="fas fa-boxes mr-2 text-primary"></i> Quản lý Sản phẩm
                        </h1>
                        <button className="btn btn-success btn-sm px-3" onClick={() => openModal()}>
                            <i className="fas fa-plus mr-1"></i> Thêm sản phẩm
                        </button>
                    </div>
                    <ol className="breadcrumb mt-1 mb-0">
                        <li className="breadcrumb-item">Admin</li>
                        <li className="breadcrumb-item active">Sản phẩm</li>
                    </ol>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">

                    {/* ── BỘ LỌC ── */}
                    <div className="card shadow-sm mb-3">
                        <div className="card-body py-3">
                            <form onSubmit={e => { e.preventDefault(); setFilters(f => ({ ...f, page: 1 })); }}>
                                <div className="row align-items-center">
                                    <div className="col-md-5 mb-2 mb-md-0">
                                        <div className="input-group input-group-sm">
                                            <div className="input-group-prepend">
                                                <span className="input-group-text"><i className="fas fa-search"></i></span>
                                            </div>
                                            <input type="text" className="form-control"
                                                placeholder="Tìm theo tên sản phẩm..."
                                                value={filters.keyword}
                                                onChange={e => setFilters(f => ({ ...f, keyword: e.target.value, page: 1 }))} />
                                        </div>
                                    </div>
                                    <div className="col-md-3 mb-2 mb-md-0">
                                        <select className="form-control form-control-sm"
                                            value={filters.sortBy}
                                            onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value, page: 1 }))}>
                                            <option value="default">Sắp xếp: Mới nhất</option>
                                            <option value="stock_asc">Tồn kho thấp nhất</option>
                                            <option value="profit_desc">Lợi nhuận cao nhất</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4 text-right">
                                        <button type="button"
                                            className={`btn btn-sm mr-2 ${showAdvanced ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                            onClick={() => setShowAdvanced(v => !v)}>
                                            <i className="fas fa-sliders-h mr-1"></i>
                                            {showAdvanced ? 'Thu gọn' : 'Lọc nâng cao'}
                                            {hasAdv && <span className="badge badge-danger ml-1">!</span>}
                                        </button>
                                        <button type="submit" className="btn btn-sm btn-primary">
                                            <i className="fas fa-filter mr-1"></i> Áp dụng
                                        </button>
                                    </div>
                                </div>

                                {showAdvanced && (
                                    <div className="mt-3 pt-3 border-top">
                                        <div className="row align-items-end">
                                            <div className="col-md-3 mb-2">
                                                <label className="small font-weight-bold text-muted mb-1">Danh mục</label>
                                                <select className="form-control form-control-sm"
                                                    value={filters.categoryId}
                                                    onChange={e => setFilters(f => ({ ...f, categoryId: e.target.value, page: 1 }))}>
                                                    <option value="">-- Tất cả --</option>
                                                    {categories.map(c => <option key={c.id || c.Id} value={c.id || c.Id}>{c.name || c.Name}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-md-3 mb-2">
                                                <label className="small font-weight-bold text-muted mb-1">Nhà cung cấp</label>
                                                <select className="form-control form-control-sm"
                                                    value={filters.supplierId}
                                                    onChange={e => setFilters(f => ({ ...f, supplierId: e.target.value, page: 1 }))}>
                                                    <option value="">-- Tất cả --</option>
                                                    {suppliers.map(s => <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-md-2 mb-2">
                                                <label className="small font-weight-bold text-muted mb-1">Tồn dưới mức</label>
                                                <input type="number" className="form-control form-control-sm"
                                                    placeholder="VD: 5" value={filters.maxStock}
                                                    onChange={e => setFilters(f => ({ ...f, maxStock: e.target.value, page: 1 }))} />
                                            </div>
                                            {hasAdv && (
                                                <div className="col-md-2 mb-2">
                                                    <button type="button" className="btn btn-sm btn-link text-danger p-0"
                                                        onClick={() => setFilters(f => ({ ...f, categoryId: '', supplierId: '', maxStock: '', page: 1 }))}>
                                                        <i className="fas fa-times mr-1"></i>Xoá lọc
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* ── BẢNG ── */}
                    <div className="card shadow-sm">
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover table-bordered mb-0" style={{ minWidth: 860 }}>
                                    <thead className="thead-dark">
                                        <tr style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                            <th className="text-center" style={{ width: 50 }}>ID</th>
                                            <th style={{ width: 60 }}>Ảnh</th>
                                            <th style={{ minWidth: 200 }}> Tên sản phẩm</th>
                                            <th style={{ width: 120 }}>Danh mục</th>
                                            <th className="text-right" style={{ width: 120 }}>Giá bán</th>
                                            <th className="text-right" style={{ width: 120 }}>Hạn sử dụng</th>
                                            <th className="text-center" style={{ width: 85 }}>Tồn kho</th>
                                            {isAdmin() && <th className="text-center" style={{ width: 100 }}>Thao tác</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={8} className="text-center py-5">
                                                <div className="spinner-border text-primary mb-2" style={{ width: 28, height: 28 }}></div>
                                                <p className="text-muted mb-0" style={{ fontSize: 13 }}>Đang tải...</p>
                                            </td></tr>
                                        ) : products.length === 0 ? (
                                            <tr><td colSpan={8} className="text-center py-5 text-muted">
                                                <i className="fas fa-box-open fa-3x d-block mb-3 opacity-15"></i>
                                                Không tìm thấy sản phẩm nào
                                            </td></tr>
                                        ) : products.map((p, idx) => {
                                            const loinuan = (p.price || 0) - (p.importPrice || 0);
                                            return (
                                                <tr key={p.id} style={{ backgroundColor: p.stock <= 5 ? '#fffbea' : 'inherit' }}>
                                                    <td className="text-center text-muted" style={{ fontSize: 12 }}>#{p.id}</td>
                                                    <td className="text-center">
                                                        <img
                                                            src={imgError[p.id]
                                                                ? `/images/prod-${(idx % 12) + 1}.jpg`
                                                                : (p.imageUrl || `/images/prod-${(idx % 12) + 1}.jpg`)}
                                                            onError={() => setImgError(e => ({ ...e, [p.id]: true }))}
                                                            alt={p.name}
                                                            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div className="font-weight-bold" style={{ fontSize: 13 }}>{p.name}</div>
                                                        <div className="mt-1 d-flex flex-wrap" style={{ gap: 4 }}>
                                                            {p.brand    && <span className="badge badge-light border">{p.brand}</span>}
                                                            {p.volume   && <span className="badge badge-light border">{p.volume}</span>}
                                                            {p.origin   && <span className="badge badge-light border">{p.origin}</span>}
                                                            {p.variants?.length > 0 && (
                                                                <span className="badge badge-light border">
                                                                    <i className="fas fa-list mr-1" style={{ fontSize: 9 }}></i>
                                                                    {p.variants.length} phân loại
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-center align-middle">
                                                            <span className="badge badge-pill badge-light border" style={{ fontSize: 11 }}>
                                                                {categories.find(c => c.id === p.categoryId || c.Id === p.categoryId)?.name || p.category?.name || p.categoryName || '—'}
                                                            </span>
                                                        </td>
                                                    <td className="text-right font-weight-bold" style={{ fontSize: 13 }}>
                                                        {p.price?.toLocaleString('vi-VN')}đ
                                                    </td>
                                                    <td className="text-center align-middle" style={{ fontSize: 13 }}>
                                                            {p.expiryDate ? (
                                                                <span className="text-info font-weight-bold">
                                                                    <i className="far fa-calendar-alt mr-1"></i>
                                                                    {new Date(p.expiryDate).toLocaleDateString('vi-VN')}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted">—</span>
                                                            )}
                                                        </td>
                                                    <td className="text-center">{stockBadge(p.stock)}</td>
                                                    {isAdmin() && (
                                                        <td className="text-center text-nowrap">
                                                            <button className="btn btn-sm btn-outline-info mr-1"
                                                                onClick={() => openModal(p)} title="Sửa">
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDelete(p.id)} title="Xóa">
                                                                <i className="fas fa-trash"></i>
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

                        {!loading && (
                            <div className="card-footer d-flex justify-content-between align-items-center flex-wrap">
                                <span className="text-muted small mb-1">
                                    Hiển thị <strong>{products.length}</strong> / <strong>{totalCount}</strong> sản phẩm
                                </span>
                                <ul className="pagination pagination-sm mb-1">
                                    <li className={`page-item ${filters.page === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>«</button>
                                    </li>
                                    {renderPagination()}
                                    <li className={`page-item ${filters.page >= totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>»</button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                </div>
            </section>

            {/* ══════════════════════════════════════
                MODAL
            ══════════════════════════════════════ */}
            {showModal && (
                <div className="products-modal">
                    <div className="modal fade show" style={{ display: 'block' }}
                        onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                        <div className="modal-dialog modal-xl modal-dialog-scrollable">
                            <form className="modal-content" onSubmit={handleSubmit}>

                                {/* Header */}
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title">
                                        <i className={`fas ${editingProduct ? 'fa-edit' : 'fa-plus-circle'} mr-2`}></i>
                                        {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                                    </h5>
                                    <button type="button" className="close text-white" onClick={closeModal}>
                                        <span>&times;</span>
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="modal-body">
                                    {error && (
                                        <div className="alert alert-danger py-2 mb-3" style={{ fontSize: 13, borderRadius: 8 }}>
                                            <i className="fas fa-exclamation-triangle mr-2"></i>{error}
                                        </div>
                                    )}

                                    <div className="row">

                                        {/* ── CỘT TRÁI ── */}
                                        <div className="col-lg-7">

                                            {/* 1. Thông tin cơ bản */}
                                            <div className="card mb-3">
                                                <div className="card-body">
                                                    <div className="prod-section-head">
                                                        <i className="fas fa-info-circle"></i> 1. Thông tin cơ bản
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="prod-label">Tên sản phẩm <span className="text-danger">*</span></label>
                                                        <input type="text" className="form-control form-control-sm"
                                                            placeholder="VD: Johnnie Walker Black Label 750ml"
                                                            value={formData.name} onChange={e => setF('name', e.target.value)} required />
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-4">
                                                            <div className="form-group">
                                                                <label className="prod-label">Danh mục <span className="text-danger">*</span></label>
                                                                <select className="form-control form-control-sm"
                                                                    value={formData.categoryId} onChange={e => setF('categoryId', e.target.value)} required>
                                                                    <option value="">-- Chọn --</option>
                                                                    {categories.map(c => <option key={c.id || c.Id} value={c.id || c.Id}>{c.name || c.Name}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="form-group">
                                                                <label className="prod-label">Thương hiệu</label>
                                                                <input type="text" className="form-control form-control-sm"
                                                                    placeholder="VD: Johnnie Walker"
                                                                    value={formData.brand} onChange={e => setF('brand', e.target.value)} />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="form-group">
                                                                <label className="prod-label">Nhà cung cấp</label>
                                                                <select className="form-control form-control-sm"
                                                                    value={formData.supplierId} onChange={e => setF('supplierId', e.target.value)}>
                                                                    <option value="">-- Không có --</option>
                                                                    {suppliers.map(s => <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="form-group mb-0">
                                                        <label className="prod-label">Mô tả sản phẩm</label>
                                                        <textarea className="form-control form-control-sm" rows="3"
                                                            placeholder="Mô tả ngắn về sản phẩm..."
                                                            value={formData.description} onChange={e => setF('description', e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 2. Giá & Kho */}
                                            <div className="card mb-3">
                                                <div className="card-body">
                                                    <div className="prod-section-head">
                                                        <i className="fas fa-dollar-sign"></i> 2. Giá & Tồn kho
                                                    </div>
                                                    <div className="row">
                                                       <div className="row">
    {/* 1. Ô GIÁ NHẬP */}
    <div className="col-md-3">
        <div className="form-group">
            <label className="prod-label">Giá nhập (đ) <span className="text-danger">*</span></label>
            <input type="number" className="form-control form-control-sm" min="0"
                value={formData.importPrice} onChange={e => setF('importPrice', e.target.value)} required />
        </div>
    </div>

    {/* 2. Ô GIÁ BÁN */}
    <div className="col-md-3">
        <div className="form-group">
            <label className="prod-label">Giá bán (đ) <span className="text-danger">*</span></label>
            <input type="number" className="form-control form-control-sm" min="0"
                value={formData.price} onChange={e => setF('price', e.target.value)} required />
        </div>
    </div>

    {/* 3. Ô TỒN KHO */}
    <div className="col-md-3">
        <div className="form-group">
            <label className="prod-label">Tồn kho <span className="text-danger">*</span></label>
            <input type="number" className="form-control form-control-sm" min="0"
                value={formData.stock} onChange={e => setF('stock', e.target.value)} required />
        </div>
    </div>

    {/* 4. Ô HẠN SỬ DỤNG (Đứng ngang hàng, chia đều 4 cột cực đẹp) */}
    <div className="col-md-3">
        <div className="form-group">
            <label className="prod-label">
                Hạn sử dụng <span className="text-muted font-weight-normal" style={{fontSize: '0.85em'}}>(Tùy chọn)</span>
            </label>
            <input
                type="date"
                name="expiryDate"
                className="form-control form-control-sm"
                value={formData.expiryDate || ''}
                onChange={(e) => setF('expiryDate', e.target.value)} 
            />
        </div>
    </div>
</div>
                                                        <div className="col-md-3 form-group">
                                                        <label className="font-weight-bold small">Tồn kho <span className="text-danger">*</span></label>
                                                        {/* 🟢 Nếu có phân loại, tự động tính tổng hiển thị lên và KHÓA ô này lại */}
                                                        <input 
                                                            type="number" 
                                                            className="form-control form-control-sm bg-light" 
                                                            value={formData.variants.length > 0 
                                                                ? formData.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) 
                                                                : formData.stock} 
                                                            onChange={(e) => setFormData(f => ({ ...f, stock: e.target.value }))} 
                                                            disabled={formData.variants.length > 0} 
                                                            title={formData.variants.length > 0 ? "Tồn kho tự động tính từ Phân loại" : ""}
                                                            required 
                                                        />
                                                    </div>
                                                    </div>

                                                    {/* Preview lợi nhuận */}
                                                    {(Number(formData.price) > 0 || Number(formData.importPrice) > 0) && (
                                                        <div className={`alert py-2 mb-0 ${profit >= 0 ? 'alert-success' : 'alert-danger'}`}
                                                            style={{ fontSize: 13, borderRadius: 8 }}>
                                                            <i className="fas fa-calculator mr-2"></i>
                                                            Lợi nhuận dự kiến:{' '}
                                                            <strong>{profit >= 0 ? '+' : ''}{profit.toLocaleString('vi-VN')} đ</strong>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>


                                            {/* 3. Chi tiết */}
                                            <div className="card mb-3">
                                                <div className="card-body">
                                                    <div className="prod-section-head">
                                                        <i className="fas fa-wine-bottle"></i> 3. Chi tiết sản phẩm
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-3">
                                                            <div className="form-group">
                                                                <label className="prod-label">Dung tích gốc</label>
                                                                <input type="text" className="form-control form-control-sm"
                                                                    placeholder="VD: 750ml"
                                                                    value={formData.volume} onChange={e => setF('volume', e.target.value)} />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="form-group">
                                                                <label className="prod-label">Xuất xứ</label>
                                                                <input type="text" className="form-control form-control-sm"
                                                                    placeholder="VD: Scotland"
                                                                    value={formData.origin} onChange={e => setF('origin', e.target.value)} />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="form-group">
                                                                <label className="prod-label">Loại da phù hợp</label>
                                                                <input type="text" className="form-control form-control-sm"
                                                                    placeholder="VD: Da mụn"
                                                                    value={formData.skinType} onChange={e => setF('skinType', e.target.value)} />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="form-group">
                                                                <label className="prod-label">Kết cấu</label>
                                                                <input type="text" className="form-control form-control-sm"
                                                                    placeholder="VD: Gel, Kem"
                                                                    value={formData.formulation} onChange={e => setF('formulation', e.target.value)} />
                                                            </div>
                                                        </div>
                                                        <div className="col-12">
                                                            <div className="form-group mb-0">
                                                                <label className="prod-label">
                                                                    <i className="fab fa-youtube mr-1 text-danger"></i>
                                                                    Link video hướng dẫn (YouTube embed)
                                                                </label>
                                                                <input type="text" className="form-control form-control-sm"
                                                                    placeholder="VD: https://www.youtube.com/embed/..."
                                                                    value={formData.videoUrl} onChange={e => setF('videoUrl', e.target.value)} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 4. Phân loại Variants */}
                                            <div className="card">
                                                <div className="card-body">
                                                    <div className="prod-section-head">
                                                        <i className="fas fa-list-ul"></i> 4. Phân loại sản phẩm (Variants)
                                                        <button type="button"
                                                            className="btn btn-sm btn-outline-primary ml-auto"
                                                            style={{ borderRadius: 7, fontSize: 12 }}
                                                            onClick={addVariant}>
                                                            <i className="fas fa-plus mr-1"></i> Thêm phân loại
                                                        </button>
                                                    </div>

                                                    {formData.variants.length === 0 ? (
                                                        <div className="variants-empty">
                                                            <i className="fas fa-info-circle mr-2 text-primary"></i>
                                                            Sản phẩm dùng giá và tồn kho mặc định ở trên.
                                                            Bấm <strong>"Thêm phân loại"</strong> nếu muốn tạo các tùy chọn riêng
                                                            (VD: 350ml giá 300k, 750ml giá 600k).
                                                        </div>
                                                    ) : (
                                                
                                                    <div className="table-responsive border rounded mt-3">
                                                        <table className="table table-hover mb-0 align-middle text-center" style={{ minWidth: '500px' }}>
                                                            <thead style={{ backgroundColor: '#f1f3f5' }}>
                                                                <tr>
                                                                    <th className="text-dark text-left align-middle" style={{ width: '40%', fontSize: '13px' }}>
                                                                        Tên phân loại <span className="text-danger">*</span>
                                                                    </th>
                                                                    <th className="text-dark align-middle" style={{ width: '30%', fontSize: '13px' }}>
                                                                        Giá bán (đ) <span className="text-danger">*</span>
                                                                    </th>
                                                                    <th className="text-dark align-middle" style={{ width: '20%', fontSize: '13px' }}>
                                                                        Tồn kho <span className="text-danger">*</span>
                                                                    </th>
                                                                    <th className="text-dark align-middle" style={{ width: '10%', fontSize: '13px' }}>
                                                                        Xóa
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {formData.variants.map((v, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="p-2">
                                                                            <input type="text" className="form-control form-control-sm" 
                                                                                placeholder="VD: 50ml, Hộp 5 miếng..." 
                                                                                value={v.name} 
                                                                                onChange={(e) => handleVariantChange(idx, 'name', e.target.value)} required />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <input type="number" className="form-control form-control-sm text-right font-weight-bold text-danger" 
                                                                                placeholder="0"
                                                                                value={v.price} 
                                                                                onChange={(e) => handleVariantChange(idx, 'price', e.target.value)} required />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <input type="number" className="form-control form-control-sm text-center font-weight-bold" 
                                                                                placeholder="0"
                                                                                value={v.stock} 
                                                                                onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)} required />
                                                                        </td>
                                                                        <td className="p-2 align-middle">
                                                                            <button type="button" className="btn btn-sm btn-outline-danger shadow-sm" 
                                                                                style={{ padding: '3px 8px', borderRadius: '4px' }} 
                                                                                onClick={() => removeVariant(idx)}>
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
                                            </div>
                                        </div>

                                        {/* ── CỘT PHẢI: ảnh ── */}
                                        <div className="col-lg-5">
                                            <div className="card">
                                                <div className="card-body">
                                                    <div className="prod-section-head">
                                                        <i className="fas fa-images"></i> 5. Hình ảnh sản phẩm
                                                    </div>

                                                    {/* Ảnh chính */}
                                                    <div className="form-group">
                                                        <label className="prod-label">
                                                            Ảnh đại diện <span className="text-danger">*</span>
                                                        </label>
                                                        <input type="text" className="form-control form-control-sm"
                                                            placeholder="https://... hoặc /images/prod.jpg"
                                                            value={formData.imageUrl}
                                                            onChange={e => setF('imageUrl', e.target.value)} />

                                                        <div className="prod-img-preview mt-2">
                                                            {formData.imageUrl ? (
                                                                <img src={formData.imageUrl} alt="Preview"
                                                                    onError={e => { e.target.src = '/images/prod-1.jpg'; }} />
                                                            ) : (
                                                                <div className="prod-img-empty">
                                                                    <i className="fas fa-image fa-2x mb-2"></i>
                                                                    <span>Chưa có ảnh đại diện</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Ảnh phụ */}
                                                    <div className="form-group mb-0">
                                                        <label className="prod-label">
                                                            Ảnh chi tiết
                                                            <span className="text-muted font-weight-normal ml-1">(tùy chọn)</span>
                                                        </label>
                                                        <textarea className="form-control form-control-sm" rows="3"
                                                            placeholder="Dán các link ảnh phụ, cách nhau bằng dấu phẩy..."
                                                            value={formData.galleryImages}
                                                            onChange={e => setF('galleryImages', e.target.value)} />

                                                        {formData.galleryImages && (
                                                            <div className="prod-gallery-preview mt-2">
                                                                {formData.galleryImages.split(',').map((url, i) => {
                                                                    const u = url.trim();
                                                                    if (!u) return null;
                                                                    return (
                                                                        <img key={i} src={u} alt={`g${i}`}
                                                                            onError={e => { e.target.style.display = 'none'; }} />
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                        <small className="text-muted">Tối đa 5 ảnh, cách nhau bằng dấu phẩy</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="modal-footer bg-white">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}
                                        style={{ borderRadius: 8, fontSize: 13 }}>
                                        <i className="fas fa-times mr-1"></i> Hủy
                                    </button>
                                    <button type="submit" className="btn btn-primary"
                                        style={{ borderRadius: 8, fontSize: 13 }}>
                                        <i className={`fas ${editingProduct ? 'fa-save' : 'fa-plus'} mr-1`}></i>
                                        {editingProduct ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </div>
            )}

        </div>
    );
};

export default Products;
