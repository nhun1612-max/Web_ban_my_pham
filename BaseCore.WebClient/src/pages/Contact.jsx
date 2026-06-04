import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Contact.css';



const Contact = () => {
  return (
    <>
      <div>
        {/* ── HERO ── */}
        <section
          className="hero-wrap hero-wrap-2"
          style={{ backgroundImage: 'url("/images/bg-92.jpg")' }}
          data-stellar-background-ratio="0.5"
        >
          <div className="overlay" />
          <div className="container">
            <div className="row no-gutters slider-text align-items-end justify-content-center">
              <div className="col-md-9 ftco-animate mb-5 text-center">
                <p className="breadcrumbs mb-0">
                  <span className="mr-2">
                    <Link to="/">Trang Chủ <i className="fa fa-chevron-right" /></Link>
                  </span>
                  <span>Liên Hệ <i className="fa fa-chevron-right" /></span>
                </p>
                <h2 className="mb-0 bread">Liên Hệ Với Chúng Tôi</h2>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONTACT SECTION ── */}
        <section className="ftco-section bg-light">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-12">
                <div className="wrapper px-md-4">

                  {/* ── INFO BOXES ── */}
                  <div className="row mb-5">
                    {/* Địa chỉ */}
                    <div className="col-md-3">
                      <div className="dbox w-100 text-center">
                        <div className="icon d-flex align-items-center justify-content-center">
                          <span className="fa fa-map-marker" />
                        </div>
                        <div className="text">
                          <p>
                            <span>Địa Chỉ:</span>
                            198 Đường Tây 21, Tầng 721, Hà Nội 10016
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Điện thoại */}
                    <div className="col-md-3">
                      <div className="dbox w-100 text-center">
                        <div className="icon d-flex align-items-center justify-content-center">
                          <span className="fa fa-phone" />
                        </div>
                        <div className="text">
                          <p>
                            <span>Điện Thoại:</span>
                            <a href="tel://1234567920">+ 1235 2355 98</a>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-md-3">
                      <div className="dbox w-100 text-center">
                        <div className="icon d-flex align-items-center justify-content-center">
                          <span className="fa fa-paper-plane" />
                        </div>
                        <div className="text">
                          <p>
                            <span>Email:</span>
                            <a href="mailto:info@yoursite.com">info@yoursite.com</a>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Website */}
                    <div className="col-md-3">
                      <div className="dbox w-100 text-center">
                        <div className="icon d-flex align-items-center justify-content-center">
                          <span className="fa fa-globe" />
                        </div>
                        <div className="text">
                          <p>
                            <span>Website</span>
                            <a href="#">yoursite.com</a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── FORM + MAP ── */}
                  <div className="row no-gutters">
                    {/* Form liên hệ */}
                    <div className="col-md-7">
                      <div className="contact-wrap w-100 p-md-5 p-4">
                        <h3 className="mb-4">Gửi Tin Nhắn</h3>

                        <form
                          method="POST"
                          id="contactForm"
                          name="contactForm"
                          className="contactForm"
                        >
                          <div className="row">
                            {/* Họ và tên */}
                            <div className="col-md-6">
                              <div className="form-group">
                                <label className="label" htmlFor="name">
                                  Họ và Tên
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="name"
                                  id="name"
                                  placeholder="Nhập họ và tên"
                                />
                              </div>
                            </div>

                            {/* Email */}
                            <div className="col-md-6">
                              <div className="form-group">
                                <label className="label" htmlFor="email">
                                  Địa Chỉ Email
                                </label>
                                <input
                                  type="email"
                                  className="form-control"
                                  name="email"
                                  id="email"
                                  placeholder="Nhập địa chỉ email"
                                />
                              </div>
                            </div>

                            {/* Tiêu đề */}
                            <div className="col-md-12">
                              <div className="form-group">
                                <label className="label" htmlFor="subject">
                                  Tiêu Đề
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="subject"
                                  id="subject"
                                  placeholder="Nhập tiêu đề"
                                />
                              </div>
                            </div>

                            {/* Nội dung */}
                            <div className="col-md-12">
                              <div className="form-group">
                                <label className="label" htmlFor="message">
                                  Nội Dung
                                </label>
                                <textarea
                                  name="message"
                                  className="form-control"
                                  id="message"
                                  cols={30}
                                  rows={4}
                                  placeholder="Nhập nội dung tin nhắn..."
                                  defaultValue=""
                                />
                              </div>
                            </div>

                            {/* Nút gửi */}
                            <div className="col-md-12">
                              <div className="form-group">
                                <input
                                  type="submit"
                                  defaultValue="Gửi Tin Nhắn"
                                  className="btn btn-primary"
                                />
                                <div className="submitting" />
                              </div>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* Bản đồ */}
                    <div className="col-md-5 order-md-first d-flex align-items-stretch">
                      <div id="map" className="map" />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Contact;
