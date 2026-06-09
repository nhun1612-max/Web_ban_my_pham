import React, { useState, useEffect } from 'react';
import { categoryApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Categories.css';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [error, setError] = useState('');
    const { isAdmin } = useAuth();

    const [filters, setFilters] = useState({ keyword: '', page: 1, pageSize: 5 });
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => loadCategories(), 500);
        return () => clearTimeout(t);
    }, [filters.keyword, filters.page, filters.pageSize]);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const response = await categoryApi.search(filters);
            setCategories(response.data.items || []);
            setTotalPages(response.data.totalPages || 0);
            setTotalCount(response.data.totalCount || 0);
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name || category.Name,
                description: category.description || category.Description || '',
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
        }
        setError('');
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingCategory(null); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        try {
            if (editingCategory) {
                const catId = editingCategory.id || editingCategory.Id;
                await categoryApi.update(catId, { id: catId, ...formData });
            } else {
                await categoryApi.create(formData);
            }
            closeModal(); loadCategories();
        } catch (error) {
            setError(error.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Nếu xóa danh mục này, tất cả sản phẩm thuộc danh mục cũng sẽ bị xóa. Bạn có chắc không?')) return;
        try {
            await categoryApi.delete(id);
            if (categories.length === 1 && filters.page > 1)
                setFilters({ ...filters, page: filters.page - 1 });
            else loadCategories();
        } catch {
            alert('Không thể xóa danh mục này.');
        }
    };

    return (
        <div className="categories-page">
            {/* PAGE HEADER */}
            <div className="content-header">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">
                        <h1 className="m-0 font-weight-bold" style={{ fontSize: 22 }}>
                            <i className="fas fa-tags mr-2 text-success"></i> Quản lý Danh mục
                        </h1>
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item">Admin</li>
                            <li className="breadcrumb-item active">Danh mục</li>
                        </ol>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card shadow-sm" style={{ borderRadius: 12 }}>

                        {/* HEADER */}
                        <div className="card-header bg-white">
                            <div className="row align-items-center">
                                <div className="col-md-4">
                                    <h3 className="card-title font-weight-bold m-0">
                                        Danh sách Danh mục
                                        <span className="badge badge-light border ml-2" style={{ fontSize: 13 }}>{totalCount}</span>
                                    </h3>
                                </div>
                                <div className="col-md-4">
                                    <div className="input-group input-group-sm">
                                        <div className="input-group-prepend">
                                            <span className="input-group-text"><i className="fas fa-search"></i></span>
                                        </div>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Tìm kiếm theo tên danh mục..."
                                            value={filters.keyword}
                                            onChange={(e) => setFilters({ ...filters, keyword: e.target.value, page: 1 })}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4 text-right">
                                    {isAdmin() && (
                                        <button className="btn btn-success btn-sm px-3" onClick={() => openModal()}>
                                            <i className="fas fa-plus mr-1"></i> Thêm danh mục
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* BẢNG */}
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-success"></div>
                                    <p className="mt-2 text-muted">Đang tải...</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover table-bordered mb-0">
                                        <thead>
                                            <tr style={{ background: '#f8f9fb' }}>
                                                <th className="text-center" style={{ width: 60, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280' }}>STT</th>
                                                <th style={{ width: 70, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280' }}>Mã</th>
                                                <th style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280' }}>Tên danh mục</th>
                                                <th style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280' }}>Mô tả</th>
                                                {isAdmin() && <th className="text-center" style={{ width: 110, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280' }}>Thao tác</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.length === 0 ? (
                                                <tr>
                                                    <td colSpan={isAdmin() ? 5 : 4} className="text-center py-5 text-muted">
                                                        <i className="fas fa-tags fa-2x d-block mb-2" style={{ opacity: 0.2 }}></i>
                                                        Không tìm thấy danh mục nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                categories.map((category, index) => {
                                                    const catId   = category.id   || category.Id;
                                                    const catName = category.name || category.Name;
                                                    const catDesc = category.description || category.Description;
                                                    return (
                                                        <tr key={catId}>
                                                            <td className="text-center text-muted align-middle" style={{ fontSize: 13 }}>
                                                                {(filters.page - 1) * filters.pageSize + index + 1}
                                                            </td>
                                                            <td className="text-muted small align-middle">#{catId}</td>
                                                            <td className="align-middle">
                                                                <span className="font-weight-bold">{catName}</span>
                                                            </td>
                                                            <td className="text-muted align-middle" style={{ fontSize: 13 }}>
                                                                {catDesc || <em className="text-muted">Chưa có mô tả</em>}
                                                            </td>
                                                            {isAdmin() && (
                                                                <td className="text-center align-middle text-nowrap">
                                                                    <button className="btn btn-sm btn-outline-info mr-2" onClick={() => openModal(category)} title="Chỉnh sửa">
                                                                        <i className="fas fa-edit"></i>
                                                                    </button>
                                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(catId)} title="Xóa">
                                                                        <i className="fas fa-trash"></i>
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* PHÂN TRANG */}
                        {!loading && totalPages > 0 && (
                            <div className="card-footer bg-white d-flex justify-content-between align-items-center">
                                <span className="text-muted small">
                                    Hiển thị <strong>{(filters.page - 1) * filters.pageSize + 1}</strong>–<strong>{Math.min(filters.page * filters.pageSize, totalCount)}</strong> / <strong>{totalCount}</strong> danh mục
                                </span>
                                <ul className="pagination pagination-sm m-0">
                                    <li className={`page-item ${filters.page === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>«</button>
                                    </li>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <li key={i + 1} className={`page-item ${filters.page === i + 1 ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setFilters({ ...filters, page: i + 1 })}>{i + 1}</button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${filters.page === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>»</button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* MODAL */}
            {showModal && (
                <div className="categories-modal">
                    <div className="modal fade show" style={{ display: 'block' }} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                        <div className="modal-dialog">
                            <form className="modal-content" onSubmit={handleSubmit} style={{ borderRadius: 12 }}>
                                <div className="modal-header bg-success text-white" style={{ borderRadius: '12px 12px 0 0' }}>
                                    <h5 className="modal-title font-weight-bold">
                                        <i className={`fas ${editingCategory ? 'fa-edit' : 'fa-plus-circle'} mr-2`}></i>
                                        {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                                    </h5>
                                    <button type="button" className="close text-white" onClick={closeModal}><span>&times;</span></button>
                                </div>
                                <div className="modal-body">
                                    {error && (
                                        <div className="alert alert-danger py-2">
                                            <i className="fas fa-exclamation-triangle mr-2"></i>{error}
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label className="font-weight-bold">Tên danh mục <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control" placeholder="Ví dụ: Rượu Vang, Whisky, Cognac..."
                                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label className="font-weight-bold">Mô tả</label>
                                        <textarea className="form-control" placeholder="Mô tả ngắn về danh mục..."
                                            value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" />
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                        <i className="fas fa-times mr-1"></i> Hủy
                                    </button>
                                    <button type="submit" className="btn btn-success">
                                        <i className={`fas ${editingCategory ? 'fa-save' : 'fa-plus'} mr-1`}></i>
                                        {editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}
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

export default Categories;
