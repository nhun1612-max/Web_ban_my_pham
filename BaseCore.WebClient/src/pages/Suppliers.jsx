import React, { useState, useEffect } from 'react';
import { supplierApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
    const [error, setError] = useState('');
    const { isAdmin } = useAuth();

    const [filters, setFilters] = useState({ keyword: '', page: 1, pageSize: 5 });
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => loadSuppliers(), 500);
        return () => clearTimeout(t);
    }, [filters.keyword, filters.page, filters.pageSize]);

    const loadSuppliers = async () => {
        setLoading(true);
        try {
            const response = await supplierApi.search(filters);
            setSuppliers(response.data.items || []);
            setTotalPages(response.data.totalPages || 0);
            setTotalCount(response.data.totalCount || 0);
        } catch (error) {
            console.error('Lỗi tải nhà cung cấp:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name || supplier.Name,
                phone: supplier.phone || supplier.Phone || '',
                address: supplier.address || supplier.Address || '',
            });
        } else {
            setEditingSupplier(null);
            setFormData({ name: '', phone: '', address: '' });
        }
        setError('');
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingSupplier(null); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        try {
            if (editingSupplier) {
                const supId = editingSupplier.id || editingSupplier.Id;
                await supplierApi.update(supId, { id: supId, ...formData });
            } else {
                await supplierApi.create(formData);
            }
            closeModal(); loadSuppliers();
        } catch (error) {
            setError(error.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) return;
        try {
            await supplierApi.delete(id);
            if (suppliers.length === 1 && filters.page > 1)
                setFilters({ ...filters, page: filters.page - 1 });
            else loadSuppliers();
        } catch {
            alert('Lỗi: Không thể xóa nhà cung cấp đang có sản phẩm liên kết.');
        }
    };

    return (
        <>
            {/* PAGE HEADER */}
            <div className="content-header">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">
                        <h1 className="m-0 font-weight-bold" style={{ fontSize: 22 }}>
                            <i className="fa fa-truck mr-2 text-primary"></i> Quản lý Nhà cung cấp
                        </h1>
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item">Admin</li>
                            <li className="breadcrumb-item active">Nhà cung cấp</li>
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
                                        Danh sách Nhà cung cấp
                                        <span className="badge badge-light border ml-2" style={{ fontSize: 13 }}>{totalCount}</span>
                                    </h3>
                                </div>
                                <div className="col-md-4">
                                    <div className="input-group input-group-sm">
                                        <div className="input-group-prepend">
                                            <span className="input-group-text"><i className="fa fa-search"></i></span>
                                        </div>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Tìm kiếm theo tên hoặc SĐT..."
                                            value={filters.keyword}
                                            onChange={(e) => setFilters({ ...filters, keyword: e.target.value, page: 1 })}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4 text-right">
                                    {isAdmin() && (
                                        <button className="btn btn-primary btn-sm px-3" onClick={() => openModal()}>
                                            <i className="fa fa-plus mr-1"></i> Thêm nhà cung cấp
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* BẢNG */}
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary"></div>
                                    <p className="mt-2 text-muted">Đang tải...</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover table-bordered mb-0">
                                        <thead>
                                            <tr style={{ background: '#f8f9fb' }}>
                                                <th className="text-center" style={{ width: 60, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280' }}>STT</th>
                                                <th style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', minWidth: 180 }}>Tên nhà cung cấp</th>
                                                <th style={{ width: 140, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280' }}>Số điện thoại</th>
                                                <th style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280' }}>Địa chỉ</th>
                                                {isAdmin() && <th className="text-center" style={{ width: 110, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280' }}>Thao tác</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {suppliers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={isAdmin() ? 5 : 4} className="text-center py-5 text-muted">
                                                        <i className="fa fa-truck fa-2x d-block mb-2" style={{ opacity: 0.2 }}></i>
                                                        Không tìm thấy nhà cung cấp nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                suppliers.map((sup, index) => {
                                                    const supId = sup.id || sup.Id;
                                                    return (
                                                        <tr key={supId}>
                                                            <td className="text-center text-muted" style={{ fontSize: 13 }}>
                                                                {(filters.page - 1) * filters.pageSize + index + 1}
                                                            </td>
                                                            <td>
                                                                <div className="font-weight-bold">{sup.name || sup.Name}</div>
                                                            </td>
                                                            <td className="text-muted" style={{ fontSize: 13 }}>
                                                                {sup.phone || sup.Phone
                                                                    ? <><i className="fa fa-phone mr-1" style={{ fontSize: 11 }}></i>{sup.phone || sup.Phone}</>
                                                                    : '—'}
                                                            </td>
                                                            <td className="text-muted" style={{ fontSize: 13 }}>
                                                                {sup.address || sup.Address
                                                                    ? <><i className="fa fa-map-marker-alt mr-1" style={{ fontSize: 11 }}></i>{sup.address || sup.Address}</>
                                                                    : '—'}
                                                            </td>
                                                            {isAdmin() && (
                                                              <td className="text-center align-middle text-nowrap">
                                                                    <button className="btn btn-sm btn-outline-info mr-1" onClick={() => openModal(sup)} title="Chỉnh sửa">
                                                                        <i className="fa fa-edit"></i>
                                                                    </button>
                                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(supId)} title="Xóa">
                                                                        <i className="fa fa-trash"></i>
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
                                    Hiển thị <strong>{(filters.page - 1) * filters.pageSize + 1}</strong>–<strong>{Math.min(filters.page * filters.pageSize, totalCount)}</strong> / <strong>{totalCount}</strong> nhà cung cấp
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
                <>
                    <div className="modal fade show" style={{ display: 'block' }} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                        <div className="modal-dialog">
                            <form className="modal-content" onSubmit={handleSubmit} style={{ borderRadius: 12 }}>
                                <div className="modal-header bg-primary text-white" style={{ borderRadius: '12px 12px 0 0' }}>
                                    <h5 className="modal-title font-weight-bold">
                                        <i className={`fas ${editingSupplier ? 'fa-edit' : 'fa-plus-circle'} mr-2`}></i>
                                        {editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
                                    </h5>
                                    <button type="button" className="close text-white" onClick={closeModal}><span>&times;</span></button>
                                </div>
                                <div className="modal-body">
                                    {error && <div className="alert alert-danger py-2"><i className="fa fa-exclamation-triangle mr-2"></i>{error}</div>}
                                    <div className="form-group">
                                        <label className="font-weight-bold">Tên nhà cung cấp <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control" placeholder="Ví dụ: Công ty TNHH Rượu Pháp..."
                                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="font-weight-bold">Số điện thoại</label>
                                        <input type="text" className="form-control" placeholder="0xxx xxx xxx"
                                            value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label className="font-weight-bold">Địa chỉ</label>
                                        <textarea className="form-control" placeholder="Địa chỉ nhà cung cấp..."
                                            value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows="2" />
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                        <i className="fa fa-times mr-1"></i> Hủy
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className={`fas ${editingSupplier ? 'fa-save' : 'fa-plus'} mr-1`}></i>
                                        {editingSupplier ? 'Lưu thay đổi' : 'Thêm mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </>
    );
};

export default Suppliers;
