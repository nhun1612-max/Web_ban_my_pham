import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../services/api';
import '../styles/SkinTest.css';

const questions = [
    {
        id: 1,
        title: "Cảm giác làn da của bạn sau khi rửa mặt khoảng 1 tiếng là gì?",
        key: "skinFeel",
        options: [
            { label: "Khô căng, thô ráp", value: "Da khô", icon: "fa-leaf" },
            { label: "Đổ nhiều dầu, bóng nhờn", value: "Da dầu", icon: "fa-tint" },
            { label: "Dầu ở vùng chữ T, khô ở hai má", value: "Hỗn hợp", icon: "fa-adjust" },
            { label: "Bình thường, mềm mại", value: "Mọi loại da", icon: "fa-smile" }
        ]
    },
    {
        id: 2,
        title: "Vấn đề nào trên da khiến bạn bận tâm nhất hiện tại?",
        key: "mainConcern",
        options: [
            { label: "Mụn ẩn, mụn sưng viêm", value: "mụn", icon: "fa-virus-slash" },
            { label: "Da nhạy cảm, dễ mẩn đỏ", value: "nhạy cảm", icon: "fa-feather" },
            { label: "Nếp nhăn, dấu hiệu lão hóa", value: "lão hóa", icon: "fa-hourglass-half" },
            { label: "Da xỉn màu, thiếu sức sống", value: "sáng da", icon: "fa-sun" }
        ]
    },
    {
        id: 3,
        title: "Bạn ưu tiên kết cấu sản phẩm dưỡng như thế nào?",
        key: "texture",
        options: [
            { label: "Dạng gel/nước thấm nhanh", value: "Gel", icon: "fa-water" },
            { label: "Dạng kem ẩm mượt, giàu dưỡng", value: "Cream", icon: "fa-spa" },
            { label: "Không quan trọng, miễn là hiệu quả", value: "Bất kỳ", icon: "fa-magic" }
        ]
    }
];

const SkinTest = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    
    // 🟢 Lưu đáp án dưới dạng chuỗi đơn giản (Chỉ 1 đáp án mỗi câu)
    const [answers, setAnswers] = useState({});
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState(null);

    // 🟢 Xử lý khi chọn 1 đáp án
    const handleOptionSelect = (key, value) => {
        const newAnswers = { ...answers, [key]: value };
        setAnswers(newAnswers);
        
        // 🟢 Tự động chuyển câu sau 400ms để người dùng kịp nhìn thấy dấu Tích (✔)
        if (currentStep < questions.length - 1) {
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
            }, 400);
        } else {
            // Đã trả lời xong câu cuối -> Bắt đầu phân tích
            submitTest(newAnswers);
        }
    };

    const submitTest = (finalAnswers) => {
        setIsAnalyzing(true);
        
        setTimeout(async () => {
            try {
                // Đóng gói gửi xuống C#
                const payload = {
                    SkinType: finalAnswers.skinFeel,
                    MainConcern: finalAnswers.mainConcern,
                    TexturePreference: finalAnswers.texture
                };

                // 🟢 GỌI API THẬT
                // const res = await userApi.submitSkinQuiz(payload);
                // setResults(res.data.recommendations);
                
                // Demo
                setResults([
                    { id: 1, name: "Sữa rửa mặt Tơ Tằm", category: "Làm sạch", price: 150000, img: "/images/prod-1.jpg" },
                    { id: 2, name: "Toner Cấp Ẩm Hoa Hồng", category: "Cân bằng", price: 220000, img: "/images/prod-2.jpg" },
                    { id: 3, name: "Kem Dưỡng Chống Lão Hóa", category: "Dưỡng chuyên sâu", price: 350000, img: "/images/prod-3.jpg" }
                ]);
            } catch (error) {
                console.error("Lỗi phân tích:", error);
            } finally {
                setIsAnalyzing(false);
            }
        }, 2000);
    };

    const calculateProgress = () => {
        if (results || isAnalyzing) return 100;
        return ((currentStep) / questions.length) * 100;
    };

    return (
        <div className="skintest-wrapper">
            <div className="skintest-progress-container">
                <div className="skintest-progress-bar" style={{ width: `${calculateProgress()}%` }}></div>
            </div>

            <div className="container py-5 skintest-container">
                
                {isAnalyzing && (
                    <div className="text-center py-5 skintest-analyzing fade-in">
                        <div className="spinner-grow text-success mb-4" style={{ width: '3rem', height: '3rem', color: '#0d4a3b' }}></div>
                        <h3 className="font-weight-bold" style={{ color: '#0d4a3b' }}>Đang phân tích hồ sơ da của bạn...</h3>
                        <p className="text-muted">Hệ thống đang lựa chọn các chiết xuất thiên nhiên phù hợp nhất.</p>
                    </div>
                )}

                {!isAnalyzing && results && (
                    <div className="skintest-results fade-in">
                        <div className="text-center mb-5">
                            <h2 className="font-weight-bold" style={{ color: '#0d4a3b', fontFamily: '"Cormorant Garamond", serif', fontSize: '2.5rem' }}>
                                Chu trình dưỡng da dành riêng cho bạn
                            </h2>
                            <p className="text-muted" style={{ fontSize: '1.1rem' }}>Sự kết hợp hoàn hảo dựa trên kết quả phân tích đa vấn đề da.</p>
                        </div>
                        
                        <div className="row justify-content-center">
                            {results.map((prod, idx) => (
                                <div className="col-md-4 mb-4" key={idx}>
                                    <div className="card h-100 shadow-sm border-0 skintest-product-card">
                                        <span className="step-badge">Bước {idx + 1}</span>
                                        <img src={prod.img} className="card-img-top p-3" alt={prod.name} style={{ height: '200px', objectFit: 'contain' }} />
                                        <div className="card-body text-center">
                                            <p className="text-muted small mb-1 text-uppercase font-weight-bold" style={{ letterSpacing: '1px' }}>{prod.category}</p>
                                            <h6 className="font-weight-bold mb-3" style={{ color: '#2b2b2b' }}>{prod.name}</h6>
                                            <button className="btn btn-outline-dark btn-sm w-100 rounded-pill" onClick={() => navigate(`/product/${prod.id}`)}>
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!isAnalyzing && !results && (
                    <div className="skintest-question-box fade-in" key={currentStep}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            {currentStep > 0 ? (
                                <button className="btn btn-link text-muted skintest-back-btn p-0" onClick={() => setCurrentStep(prev => prev - 1)}>
                                    <i className="fa fa-arrow-left mr-2"></i> Trở lại
                                </button>
                            ) : <div></div>}
                            <span className="text-muted font-weight-bold">Câu {currentStep + 1} / {questions.length}</span>
                        </div>
                        
                        <h2 className="text-center mb-5 font-weight-bold skintest-question-title">
                            {questions[currentStep].title}
                        </h2>

                        <div className="row justify-content-center">
                            {questions[currentStep].options.map((opt, idx) => {
                                const currentKey = questions[currentStep].key;
                                // 🟢 Chỉ cho phép 1 đáp án được tích
                                const isSelected = answers[currentKey] === opt.value; 
                                
                                return (
                                    <div className="col-md-5 mb-3" key={idx}>
                                        <div 
                                            className={`skintest-option-card ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleOptionSelect(currentKey, opt.value)}
                                        >
                                            <i className={`fa ${opt.icon} option-icon`}></i>
                                            <span className="option-label">{opt.label}</span>
                                            
                                            {/* Ô tích vuông ✔ */}
                                            <div className={`tick-box ${isSelected ? 'active' : ''}`}>
                                                {isSelected && <i className="fa fa-check text-white"></i>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SkinTest;