import React, { useState, useEffect } from 'react';
import { orderApi } from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import '../styles/Revenue.css';

/* ── Màu sắc biểu đồ tròn ── */
const PIE_COLORS = ['#8B1A1A', '#C9A84C', '#2d7a4f', '#1565c0', '#6f42c1', '#e65100'];

/* ── Custom Tooltip cho BarChart ── */
const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 10, padding: '10px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            fontFamily: 'Inter, sans-serif', fontSize: 13,
        }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#1a1a1a' }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ margin: 0, color: p.color, fontWeight: 600 }}>
                    {p.name}: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.value)}
                </p>
            ))}
        </div>
    );
};

/* ── Custom label cho PieChart ── */
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 12, fontWeight: 700 }}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const Revenue = () => {
    const [timeFrame, setTimeFrame]         = useState('month');
    const [chartData, setChartData]         = useState([]);
    const [productRevenue, setProductRevenue] = useState([]);
    const [summary, setSummary]             = useState({ total: 0, orders: 0, avgOrder: 0, topProduct: '' });
    const [loading, setLoading]             = useState(false);
    const [activeTab, setActiveTab]         = useState('bar'); // bar | line

    const timeFrameOptions = [
        { value: 'day',     label: 'Hôm nay & 7 ngày qua' },
        { value: 'week',    label: 'Tháng này (theo tuần)' },
        { value: 'month',   label: 'Năm nay (theo tháng)'  },
        { value: 'quarter', label: 'Năm nay (theo quý)'    },
        { value: 'year',    label: 'Các năm gần đây'        },
    ];

    useEffect(() => { loadRevenueData(); }, [timeFrame]); // eslint-disable-line

    const loadRevenueData = async () => {
        setLoading(true);
        try {
            const res = await orderApi.getAdvancedRevenue(timeFrame);
            const cd  = res.data.chartData    || [];
            const pd  = res.data.productData  || [];

            setChartData(cd);
            setProductRevenue(pd);

            /* Tính summary */
            const total    = cd.reduce((s, r) => s + (r.revenue || 0), 0);
            const orders   = cd.reduce((s, r) => s + (r.orders  || 0), 0);
            const avgOrder = orders > 0 ? Math.round(total / orders) : 0;
            const topProd  = pd.sort((a, b) => b.revenue - a.revenue)[0]?.name || '—';
            setSummary({ total, orders, avgOrder, topProduct: topProd });
        } catch (err) {
            console.error('Lỗi lấy dữ liệu doanh thu', err);
        } finally {
            setLoading(false);
        }
    };

    const fmt    = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
    const fmtCmp = (v) => new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(v);

    /* Tổng để tính % cột bảng */
    const totalRevenue = productRevenue.reduce((s, p) => s + (p.revenue || 0), 0);

    return (
        <>

            {/* ── PAGE HEADER ── */}
            <div className="content-header">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">
                        <h1 className="m-0 font-weight-bold" style={{ fontSize: 22, fontFamily: 'Inter,sans-serif' }}>
                            <i className="fas fa-chart-line mr-2 text-success"></i>
                            Báo cáo Doanh thu
                        </h1>
                        <ol className="breadcrumb mb-0" style={{ fontSize: 12 }}>
                            <li className="breadcrumb-item">Admin</li>
                            <li className="breadcrumb-item active">Doanh thu</li>
                        </ol>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid rev-page">

                    {/* ── BỘ LỌC ── */}
                    <div className="rev-card">
                        <div className="rev-card-body" style={{ padding: '14px 20px' }}>
                            <div className="d-flex align-items-center flex-wrap" style={{ gap: 12 }}>
                                <label className="font-weight-bold mb-0" style={{ fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
                                    <i className="fas fa-calendar-alt mr-2 text-muted"></i>Xem theo:
                                </label>
                                <select
                                    className="form-control"
                                    style={{ maxWidth: 260 }}
                                    value={timeFrame}
                                    onChange={e => setTimeFrame(e.target.value)}
                                >
                                    {timeFrameOptions.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                                <button className="btn btn-reload" onClick={loadRevenueData}>
                                    <i className={`fas fa-sync-alt mr-1 ${loading ? 'fa-spin' : ''}`}></i>
                                    {loading ? 'Đang tải...' : 'Tải lại'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── STAT CARDS ── */}
                    <div className="row mb-3">
                        {[
                            {
                                label: 'Tổng doanh thu',
                                val: fmt(summary.total),
                                icon: 'fas fa-dollar-sign',
                                bg: 'linear-gradient(135deg, #8B1A1A, #c0392b)',
                            },
                            {
                                label: 'Số đơn hàng',
                                val: summary.orders.toLocaleString('vi-VN'),
                                icon: 'fas fa-shopping-cart',
                                bg: 'linear-gradient(135deg, #1565c0, #1976d2)',
                            },
                            {
                                label: 'Trung bình / đơn',
                                val: fmt(summary.avgOrder),
                                icon: 'fas fa-receipt',
                                bg: 'linear-gradient(135deg, #2d7a4f, #388e3c)',
                            },
                            {
                                label: 'Sản phẩm dẫn đầu',
                                val: summary.topProduct,
                                icon: 'fas fa-trophy',
                                bg: 'linear-gradient(135deg, #C9A84C, #f9a825)',
                            },
                        ].map((s, i) => (
                            <div key={i} className="col-lg-3 col-md-6 mb-3">
                                <div className="rev-stat shadow-sm" style={{ background: s.bg }}>
                                    <i className={`${s.icon} icon`}></i>
                                    <div className="val" style={{ fontSize: i === 3 ? 16 : 24 }}>{s.val}</div>
                                    <div className="lbl">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── BIỂU ĐỒ + DONUT ── */}
                    <div className="row">

                        {/* BarChart / LineChart */}
                        <div className="col-lg-8">
                            <div className="rev-card">
                                <div className="rev-card-head">
                                    <span className="rev-card-title">
                                        <i className="fas fa-chart-bar mr-2 text-success"></i>
                                        Biểu đồ biến động doanh thu
                                    </span>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            className={`rev-tab-btn ${activeTab === 'bar' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('bar')}
                                        >
                                            <i className="fas fa-chart-bar mr-1"></i> Cột
                                        </button>
                                        <button
                                            className={`rev-tab-btn ${activeTab === 'line' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('line')}
                                        >
                                            <i className="fas fa-chart-line mr-1"></i> Đường
                                        </button>
                                    </div>
                                </div>
                                <div className="rev-card-body">
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <div className="spinner-border" style={{ color: '#8B1A1A', width: 30, height: 30 }}></div>
                                            <p className="mt-2 text-muted" style={{ fontSize: 13 }}>Đang tải dữ liệu...</p>
                                        </div>
                                    ) : chartData.length === 0 ? (
                                        <div className="rev-empty">
                                            <i className="fas fa-chart-bar"></i>
                                            <p style={{ fontSize: 13 }}>Chưa có dữ liệu doanh thu trong kỳ này</p>
                                        </div>
                                    ) : (
                                        <div style={{ width: '100%', height: 320 }}>
                                            <ResponsiveContainer>
                                                {activeTab === 'bar' ? (
                                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                        <XAxis dataKey="label" axisLine={false} tickLine={false} />
                                                        <YAxis tickFormatter={fmtCmp} axisLine={false} tickLine={false} />
                                                        <Tooltip content={<CustomBarTooltip />} />
                                                        <Legend iconType="circle" iconSize={8} />
                                                        <Bar
                                                            dataKey="revenue"
                                                            name="Doanh thu"
                                                            fill="#8B1A1A"
                                                            radius={[6, 6, 0, 0]}
                                                            barSize={40}
                                                        />
                                                    </BarChart>
                                                ) : (
                                                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                        <XAxis dataKey="label" axisLine={false} tickLine={false} />
                                                        <YAxis tickFormatter={fmtCmp} axisLine={false} tickLine={false} />
                                                        <Tooltip content={<CustomBarTooltip />} />
                                                        <Legend iconType="circle" iconSize={8} />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="revenue"
                                                            name="Doanh thu"
                                                            stroke="#8B1A1A"
                                                            strokeWidth={2.5}
                                                            dot={{ r: 4, fill: '#8B1A1A' }}
                                                            activeDot={{ r: 6 }}
                                                        />
                                                    </LineChart>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pie chart */}
                        <div className="col-lg-4">
                            <div className="rev-card h-100">
                                <div className="rev-card-head">
                                    <span className="rev-card-title">
                                        <i className="fas fa-chart-pie mr-2 text-primary"></i>
                                        Cơ cấu sản phẩm
                                    </span>
                                </div>
                                <div className="rev-card-body">
                                    {loading ? (
                                        <div className="text-center py-4">
                                            <div className="spinner-border" style={{ color: '#8B1A1A', width: 24, height: 24 }}></div>
                                        </div>
                                    ) : productRevenue.length === 0 ? (
                                        <div className="rev-empty">
                                            <i className="fas fa-chart-pie"></i>
                                            <p style={{ fontSize: 13 }}>Chưa có dữ liệu</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ width: '100%', height: 200 }}>
                                                <ResponsiveContainer>
                                                    <PieChart>
                                                        <Pie
                                                            data={productRevenue}
                                                            dataKey="revenue"
                                                            nameKey="name"
                                                            cx="50%" cy="50%"
                                                            outerRadius={85}
                                                            labelLine={false}
                                                            label={renderPieLabel}
                                                        >
                                                            {productRevenue.map((_, i) => (
                                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip formatter={(v) => fmt(v)} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            {/* Legend */}
                                            <div className="pie-legend">
                                                {productRevenue.slice(0, 5).map((p, i) => (
                                                    <div key={i} className="pie-legend-item">
                                                        <div className="pie-legend-dot"
                                                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                                                        <span className="text-truncate" style={{ maxWidth: 160 }}>{p.name}</span>
                                                        <span className="ml-auto font-weight-bold" style={{ color: '#374151', whiteSpace: 'nowrap' }}>
                                                            {totalRevenue > 0
                                                                ? `${((p.revenue / totalRevenue) * 100).toFixed(1)}%`
                                                                : '—'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── BẢNG TOP SẢN PHẨM ── */}
                    <div className="rev-card">
                        <div className="rev-card-head">
                            <span className="rev-card-title">
                                <i className="fas fa-trophy mr-2 text-warning"></i>
                                Top sản phẩm mang lại doanh thu
                            </span>
                            <span className="text-muted" style={{ fontSize: 12 }}>
                                {productRevenue.length} sản phẩm
                            </span>
                        </div>
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border" style={{ color: '#8B1A1A', width: 28, height: 28 }}></div>
                                </div>
                            ) : productRevenue.length === 0 ? (
                                <div className="rev-empty">
                                    <i className="fas fa-box-open"></i>
                                    <p style={{ fontSize: 13 }}>Chưa có dữ liệu sản phẩm trong kỳ này</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="thead-light">
                                            <tr>
                                                <th style={{ width: 50 }}>Hạng</th>
                                                <th>Tên sản phẩm</th>
                                                <th className="text-center" style={{ width: 130 }}>Số lượng bán</th>
                                                <th style={{ width: 220 }}>Tỷ trọng</th>
                                                <th className="text-right" style={{ width: 160 }}>Doanh thu</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...productRevenue]
                                                .sort((a, b) => b.revenue - a.revenue)
                                                .map((prod, idx) => {
                                                    const pct = totalRevenue > 0
                                                        ? ((prod.revenue / totalRevenue) * 100).toFixed(1)
                                                        : 0;
                                                    const medals = ['🥇', '🥈', '🥉'];
                                                    return (
                                                        <tr key={idx}>
                                                            <td className="text-center font-weight-bold" style={{ fontSize: 15 }}>
                                                                {idx < 3 ? medals[idx] : idx + 1}
                                                            </td>
                                                            <td>
                                                                <span className="font-weight-bold" style={{ fontSize: 13 }}>
                                                                    {prod.name}
                                                                </span>
                                                            </td>
                                                            <td className="text-center">
                                                                <span className="badge badge-light border"
                                                                    style={{ fontSize: 12, padding: '4px 10px' }}>
                                                                    {prod.quantity?.toLocaleString('vi-VN')} SP
                                                                </span>
                                                            </td>
                                                            <td style={{ verticalAlign: 'middle' }}>
                                                                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                                                    <div className="rev-bar-bg flex-grow-1">
                                                                        <div className="rev-bar-fill"
                                                                            style={{ width: `${pct}%` }}></div>
                                                                    </div>
                                                                    <span style={{ fontSize: 12, color: '#6b7280', minWidth: 36 }}>
                                                                        {pct}%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="text-right">
                                                                <span className="font-weight-bold text-danger"
                                                                    style={{ fontSize: 13 }}>
                                                                    {fmt(prod.revenue)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </section>
        </>
    );
};

export default Revenue;
