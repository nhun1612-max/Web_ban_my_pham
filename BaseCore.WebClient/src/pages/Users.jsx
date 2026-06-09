import React, { useState, useEffect } from 'react';
import { userApi } from '../services/api';
import '../styles/Users.css';

const Users = () => {
    const [users, setUsers]           = useState([]);
    const [loading, setLoading]       = useState(true);
    const [keyword, setKeyword]       = useState('');
    const [page, setPage]             = useState(1);
    const [pageSize]                  = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal]   = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData]     = useState({
        username: '', password: '', name: '', email: '',
        phone: '', position: '', userType: 0, isActive: true,
    });
    const [error, setError] = useState('');

    useEffect(() => { loadUsers(); }, [page, keyword]); // eslint-disable-line

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await userApi.getAll({ keyword, page, pageSize });
            setUsers(res.data.data || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalCount(res.data.totalCount  || 0);
        } catch (e) { console.error('Failed to load users:', e); }
        finally { setLoading(false); }
    };

    const handleSearch = (e) => { e.preventDefault(); setPage(1); loadUsers(); };

    const openModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username, password: '',
                name: user.name || '', email: user.email || '',
                phone: user.phone || '', position: user.position || '',
                userType: user.userType || 0, isActive: user.isActive,
            });
        } else {
            setEditingUser(null);
            setFormData({ username: '', password: '', name: '', email: '', phone: '', position: '', userType: 0, isActive: true });
        }
        setError(''); setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingUser(null); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        try {
            if (editingUser) {
                const payload = {
                    name: formData.name, email: formData.email,
                    phone: formData.phone, position: formData.position,
                    userType: parseInt(formData.userType), isActive: formData.isActive,
                };
                if (formData.password) payload.password = formData.password;
                await userApi.update(editingUser.id, payload);
            } else {
                if (!formData.password) { setError('Mật khẩu là bắt buộc khi tạo tài khoản mới'); return; }
                await userApi.create({
                    username: formData.username, password: formData.password,
                    name: formData.name, email: formData.email,
                    phone: formData.phone, position: formData.position,
                    userType: parseInt(formData.userType),
                });
            }
            closeModal(); loadUsers();
        } catch (e) { setError(e.response?.data?.message || 'Thao tác thất bại'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
        try { await userApi.delete(id); loadUsers(); }
        catch { alert('Không thể xóa người dùng này.'); }
    };

    const renderVipBadge = (tier) => {
        switch (tier) {
            case 3: return <span className="vip-badge vip-diamond"><i className="fas fa-gem"></i> Kim Cương</span>;
            case 2: return <span className="vip-badge vip-gold"><i className="fas fa-crown"></i> Vàng</span>;
            case 1: return <span className="vip-badge vip-silver"><i className="fas fa-medal"></i> Bạc</span>;
            default: return <span className="vip-badge vip-normal">Khách thường</span>;
        }
    };

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
        <>
            <div className="users-page">

                {/* PAGE HEADER */}
                <div className="content-header">
                    <div className="container-fluid">
                        <div className="d-flex justify-content-between align-items-center">
                            <h1 className="m-0 font-weight-bold" style={{ fontSize: 22 }}>
                                <i className="fas fa-users mr-2" style={{ color: '#6f42c1' }}></i>
                                Quản lý Người dùng
                            </h1>
                            <ol className="breadcrumb mb-0">
                                <li className="breadcrumb-item">Admin</li>
                                <li className="breadcrumb-item active">Người dùng</li>
                            </ol>
                        </div>
                    </div>
                </div>

                <section className="content">
                    <div className="container-fluid">
                        <div className="card shadow-sm">

                            {/* HEADER */}
                            <div className="card-header">
                                <div className="row align-items-center">
                                    <div className="col-md-4">
                                        <h3 className="card-title font-weight-bold m-0" style={{ fontSize: 14 }}>
                                            Danh sách Người dùng
                                            <span className="badge badge-light border ml-2" style={{ fontSize: 12 }}>{totalCount}</span>
                                        </h3>
                                    </div>
                                    <div className="col-md-4">
                                        <form onSubmit={handleSearch}>
                                            <div className="input-group input-group-sm">
                                                <div className="input-group-prepend">
                                                    <span className="input-group-text">
                                                        <i className="fas fa-search"></i>
                                                    </span>
                                                </div>
                                                <input type="text" className="form-control"
                                                    placeholder="Tìm theo tên, email, SĐT..."
                                                    value={keyword}
                                                    onChange={e => setKeyword(e.target.value)} />
                                                <div className="input-group-append">
                                                    <button type="submit" className="btn btn-sm btn-outline-secondary">Lọc</button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                    <div className="col-md-4 text-right">
                                        <button className="btn btn-sm btn-add px-3" onClick={() => openModal()}>
                                            <i className="fas fa-plus mr-1"></i> Thêm người dùng
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* BẢNG */}
                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border" style={{ color: '#6f42c1', width: 28, height: 28 }}></div>
                                        <p className="mt-2 text-muted" style={{ fontSize: 13 }}>Đang tải...</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover table-bordered mb-0">
                                            <thead>
                                                <tr>
                                                    <th className="text-center" style={{ width: 50 }}>STT</th>
                                                    <th style={{ minWidth: 150 }}>Tên đăng nhập</th>
                                                    <th style={{ minWidth: 140 }}>Họ và tên</th>
                                                    <th style={{ minWidth: 180 }}>Email / SĐT</th>
                                                    <th className="text-right" style={{ minWidth: 120 }}>Đã mua</th>
                                                    <th className="text-center" style={{ minWidth: 120 }}>Hạng VIP</th>
                                                    <th className="text-center" style={{ width: 110 }}>Vai trò</th>
                                                    <th className="text-center" style={{ width: 110 }}>Trạng thái</th>
                                                    <th className="text-center" style={{ width: 110 }}>Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="9" className="text-center py-5 text-muted">
                                                            <i className="fas fa-users fa-3x d-block mb-3 opacity-20"></i>
                                                            Không tìm thấy người dùng nào
                                                        </td>
                                                    </tr>
                                                ) : users.map((user, idx) => (
                                                    <tr key={user.id}>
                                                        <td className="text-center text-muted" style={{ fontSize: 12 }}>
                                                            {(page - 1) * pageSize + idx + 1}
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                                                <div className="user-avatar">
                                                                    {(user.name || user.username || '?')[0].toUpperCase()}
                                                                </div>
                                                                <span className="font-weight-bold" style={{ fontSize: 13 }}>
                                                                    {user.username}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td style={{ fontSize: 13 }}>{user.name || '—'}</td>
                                                        <td style={{ fontSize: 12.5 }}>
                                                            <div className="text-muted mb-1">
                                                                <i className="fas fa-envelope mr-1" style={{ opacity: 0.45, fontSize: 10 }}></i>
                                                                {user.email || '—'}
                                                            </div>
                                                            <div className="text-muted">
                                                                <i className="fas fa-phone mr-1" style={{ opacity: 0.45, fontSize: 10 }}></i>
                                                                {user.phone || '—'}
                                                            </div>
                                                        </td>
                                                        <td className="text-right font-weight-bold text-success" style={{ fontSize: 13 }}>
                                                                    {/* 🟢 Sửa thành dòng này để bắt bọc cả trường chữ hoa chữ thường từ C# */}
                                                                    {(user.totalSpent || user.TotalSpent) 
                                                                        ? (user.totalSpent || user.TotalSpent).toLocaleString('vi-VN') + ' đ' 
                                                                        : '0 đ'}
                                                                </td>
                                                        <td className="text-center">
                                                            {renderVipBadge(user.tier)}
                                                        </td>
                                                        <td className="text-center">
                                                            <span className={`badge ${user.userType === 1 ? 'badge-danger' : 'badge-info'}`}>
                                                                {user.userType === 1 ? '👑 Admin' : 'Khách hàng'}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className={`badge ${user.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                                                <i className="fas fa-circle mr-1" style={{ fontSize: 7 }}></i>
                                                                {user.isActive ? 'Hoạt động' : 'Tạm khóa'}
                                                            </span>
                                                        </td>
                                                        <td className="text-center text-nowrap">
                                                            <button className="btn btn-sm btn-outline-info mr-1"
                                                                onClick={() => openModal(user)} title="Chỉnh sửa">
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDelete(user.id)} title="Xóa">
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* PHÂN TRANG */}
                            {!loading && totalCount > 0 && (
                                <div className="card-footer d-flex justify-content-between align-items-center">
                                    <span className="text-muted small">
                                        Tổng cộng <strong>{totalCount}</strong> người dùng
                                    </span>
                                    <ul className="pagination pagination-sm m-0">
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
            </div>

            {/* ══ MODAL ══ */}
            {showModal && (
                <div className="users-modal">
                    <div className="modal fade show" style={{ display: 'block' }}
                        onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                        <div className="modal-dialog">
                            <form className="modal-content" onSubmit={handleSubmit}>

                                <div className="modal-header text-white">
                                    <h5 className="modal-title">
                                        <i className={`fas ${editingUser ? 'fa-edit' : 'fa-user-plus'} mr-2`}></i>
                                        {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
                                    </h5>
                                    <button type="button" className="close text-white" onClick={closeModal}>
                                        <span>&times;</span>
                                    </button>
                                </div>

                                <div className="modal-body">
                                    {error && (
                                        <div className="alert alert-danger py-2">
                                            <i className="fas fa-exclamation-triangle mr-2"></i>{error}
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>Tên đăng nhập <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control" placeholder="username..."
                                            value={formData.username}
                                            onChange={e => setFormData(f => ({ ...f, username: e.target.value }))}
                                            required disabled={!!editingUser} />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Mật khẩu{' '}
                                            {editingUser
                                                ? <span className="text-muted font-weight-normal">(để trống nếu không đổi)</span>
                                                : <span className="text-danger">*</span>}
                                        </label>
                                        <input type="password" className="form-control" placeholder="••••••••"
                                            value={formData.password}
                                            onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                                            required={!editingUser} />
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Họ và tên</label>
                                                <input type="text" className="form-control" placeholder="Nguyễn Văn A"
                                                    value={formData.name}
                                                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Số điện thoại</label>
                                                <input type="text" className="form-control" placeholder="0xxx xxx xxx"
                                                    value={formData.phone}
                                                    onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Email</label>
                                        <input type="email" className="form-control" placeholder="example@email.com"
                                            value={formData.email}
                                            onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Chức vụ</label>
                                                <input type="text" className="form-control" placeholder="Ví dụ: Nhân viên kho"
                                                    value={formData.position}
                                                    onChange={e => setFormData(f => ({ ...f, position: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Vai trò</label>
                                                <select className="form-control" value={formData.userType}
                                                    onChange={e => setFormData(f => ({ ...f, userType: e.target.value }))}>
                                                    <option value="0">Khách hàng</option>
                                                    <option value="1">Admin</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {editingUser && (
                                        <div className="form-group mb-0">
                                            <div className="custom-control custom-switch">
                                                <input type="checkbox" className="custom-control-input" id="isActive"
                                                    checked={formData.isActive}
                                                    onChange={e => setFormData(f => ({ ...f, isActive: e.target.checked }))} />
                                                <label className="custom-control-label" htmlFor="isActive">
                                                    {formData.isActive ? '✅ Tài khoản đang hoạt động' : '⛔ Tài khoản tạm khóa'}
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                        <i className="fas fa-times mr-1"></i> Hủy
                                    </button>
                                    <button type="submit" className="btn btn-submit">
                                        <i className={`fas ${editingUser ? 'fa-save' : 'fa-user-plus'} mr-1`}></i>
                                        {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
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

export default Users;
