using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Services; // 🟢 FIX LỖI ĐỎ 1: Thêm dòng này để nhận diện ReviewCreateDto
using BaseCore.Services.Authen;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.AuthService.Controllers
{
    [Route("api/users")]
    [ApiController]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly AppDbContext _context;

        // 🟢 FIX LỖI ĐỎ 2: Tiêm thêm AppDbContext vào Constructor để có thể dùng _context truy vấn bảng cấm
        public UserController(IUserService userService, AppDbContext context)
        {
            _userService = userService;
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll([FromQuery] string keyword = "", [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var (users, totalCount) = await _userService.Search(keyword, page, pageSize);

            // 🟢 FIX LỖI 0 Đ: Nạp đầy đủ TotalSpent và Tier từ User gốc sang Response để gửi về cho React vẽ
            var result = users.Select(u => new UserResponse
            {
                Id = u.Id,
                Username = u.UserName,
                Name = u.Name,
                Email = u.Email,
                Phone = u.Phone,
                Position = u.Position,
                IsActive = u.IsActive,
                UserType = u.UserType,
                Created = u.Created,
                TotalSpent = u.TotalSpent, // 🟢 BẮT BUỘC CÓ DÒNG NÀY ĐỂ REACT HIỆN TIỀN CHÍNH XÁC
                Tier = (int)u.Tier         // 🟢 BẮT BUỘC CÓ DÒNG NÀY ĐỂ REACT HIỆN badge VIP (Bạc, Vàng, Kim Cương)
            });

            return Ok(new
            {
                data = result,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var user = await _userService.GetById(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new UserResponse
            {
                Id = user.Id,
                Username = user.UserName,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                Position = user.Position,
                IsActive = user.IsActive,
                UserType = user.UserType,
                Created = user.Created,
                TotalSpent = user.TotalSpent,
                Tier = (int)user.Tier
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Invalid request" });
            }

            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Username and password are required" });
            }

            try
            {
                var user = new User
                {
                    UserName = request.Username,
                    Name = request.Name ?? request.Username,
                    Email = request.Email,
                    Phone = request.Phone,
                    Position = request.Position,
                    UserType = request.UserType
                };

                var createdUser = await _userService.Create(user, request.Password);

                return CreatedAtAction(nameof(GetById), new { id = createdUser.Id }, new UserResponse
                {
                    Id = createdUser.Id,
                    Username = createdUser.UserName,
                    Name = createdUser.Name,
                    Email = createdUser.Email,
                    Phone = createdUser.Phone,
                    Position = createdUser.Position,
                    IsActive = createdUser.IsActive,
                    UserType = createdUser.UserType,
                    Created = createdUser.Created,
                    TotalSpent = createdUser.TotalSpent,
                    Tier = (int)createdUser.Tier
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Failed to create user: " + ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Invalid request" });
            }

            var existingUser = await _userService.GetById(id);
            if (existingUser == null)
            {
                return NotFound(new { message = "User not found" });
            }

            existingUser.Name = request.Name ?? existingUser.Name;
            existingUser.Email = request.Email ?? existingUser.Email;
            existingUser.Phone = request.Phone ?? existingUser.Phone;
            existingUser.Position = request.Position ?? existingUser.Position;
            existingUser.UserType = request.UserType ?? existingUser.UserType;
            existingUser.IsActive = request.IsActive ?? existingUser.IsActive;

            await _userService.Update(existingUser, request.Password);

            return Ok(new UserResponse
            {
                Id = existingUser.Id,
                Username = existingUser.UserName,
                Name = existingUser.Name,
                Email = existingUser.Email,
                Phone = existingUser.Phone,
                Position = existingUser.Position,
                IsActive = existingUser.IsActive,
                UserType = existingUser.UserType,
                Created = existingUser.Created,
                TotalSpent = existingUser.TotalSpent,
                Tier = (int)existingUser.Tier
            });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var existingUser = await _userService.GetById(id);
            if (existingUser == null)
            {
                return NotFound(new { message = "User not found" });
            }

            await _userService.Delete(id);
            return NoContent();
        }

        [HttpPost("{userId}/add-spent")]
        [AllowAnonymous]
        public async Task<IActionResult> AddUserSpent(string userId, [FromBody] AddSpentDto dto)
        {
            var user = await _userService.GetById(userId);
            if (user == null)
            {
                return NotFound(new { message = "Không tìm thấy User" });
            }

            user.TotalSpent += dto.Amount;

            if (user.TotalSpent >= 50000000)
                user.Tier = VipTier.Diamond;
            else if (user.TotalSpent >= 20000000)
                user.Tier = VipTier.Gold;
            else if (user.TotalSpent >= 5000000)
                user.Tier = VipTier.Silver;
            else
                user.Tier = VipTier.Standard;

            await _userService.Update(user, null);

            return Ok(new
            {
                message = "Cộng doanh số và xét duyệt VIP thành công!",
                totalSpent = user.TotalSpent,
                currentTier = user.Tier
            });
        }

        [HttpGet("{userId}/check-restriction/{method}")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckRestriction(string userId, string method)
        {
            var restriction = await _context.PaymentRestrictions
                .FirstOrDefaultAsync(r => r.UserId == userId
                                     && r.PaymentMethod.ToLower() == method.ToLower()
                                     && r.ExpiryDate > DateTime.Now);

            if (restriction != null)
            {
                return Ok(new { isRestricted = true, expiryDate = restriction.ExpiryDate, reason = restriction.Reason });
            }
            return Ok(new { isRestricted = false });
        }

        [HttpPost("add-restriction")]
        [AllowAnonymous]
        public async Task<IActionResult> AddRestriction([FromBody] AddRestrictionDto dto)
        {
            var existing = await _context.PaymentRestrictions
                .FirstOrDefaultAsync(r => r.UserId == dto.UserId && r.PaymentMethod == dto.PaymentMethod);

            if (existing != null)
            {
                existing.ExpiryDate = DateTime.Now.AddDays(7);
                existing.Reason = "Hủy hàng quá nhiều lần";
                _context.PaymentRestrictions.Update(existing);
            }
            else
            {
                var newRestriction = new PaymentRestriction
                {
                    UserId = dto.UserId,
                    PaymentMethod = dto.PaymentMethod,
                    Reason = "Hủy hàng quá nhiều lần",
                    ExpiryDate = DateTime.Now.AddDays(7)
                };
                _context.PaymentRestrictions.Add(newRestriction);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã áp dụng lệnh cấm thành công" });
        }

        // =================================================================
        // 🌿 BỔ SUNG API MỚI: XỬ LÝ KẾT QUẢ BÀI TRẮC NGHIỆM DA (SKIN TEST)
        // =================================================================
        [HttpPost("submit-skin-quiz")]
        [Authorize] // Yêu cầu có token (đã đăng nhập)
        public async Task<IActionResult> SubmitSkinQuiz([FromBody] SkinQuizSubmitDto dto)
        {
            // 1. Lấy ID user từ Token
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Vui lòng đăng nhập để lưu hồ sơ da!" });

            // 2. Lưu kết quả vào bảng UserSkinProfiles (Bảng bạn vừa tạo bằng lệnh SQL)
            var skinProfile = new UserSkinProfile
            {
                UserId = userId,
                SkinType = dto.SkinType ?? "",
                MainConcern = dto.MainConcern ?? "",
                TexturePreference = dto.TexturePreference ?? "",
                CreatedAt = DateTime.Now
            };

            _context.UserSkinProfiles.Add(skinProfile);
            await _context.SaveChangesAsync();

            // 3. Quét sản phẩm khớp với SkinType hoặc Tên/Mô tả có chứa vấn đề cần trị
            var recommendedProducts = await _context.Products
                .Where(p => (p.SkinType != null && p.SkinType.Contains(dto.SkinType))
                         || (p.Description != null && p.Description.Contains(dto.MainConcern))
                         || (p.Name != null && p.Name.Contains(dto.MainConcern)))
                .Select(p => new {
                    id = p.Id,
                    name = p.Name,
                    category = p.Category != null ? p.Category.Name : "Chăm sóc chuyên sâu",
                    price = p.Price,
                    img = p.ImageUrl
                })
                .OrderByDescending(p => p.id)
                .Take(3) // Giới hạn đúng 3 sản phẩm chuẩn nhất
                .ToListAsync();

            // 4. Nếu thuật toán không khớp món nào, lấy tạm 3 sản phẩm mới nhất để khách không bị trống màn hình
            if (!recommendedProducts.Any())
            {
                recommendedProducts = await _context.Products
                    .OrderByDescending(p => p.Id)
                    .Take(3)
                    .Select(p => new {
                        id = p.Id,
                        name = p.Name,
                        category = "Được yêu thích",
                        price = p.Price,
                        img = p.ImageUrl
                    }).ToListAsync();
            }

            return Ok(new { recommendations = recommendedProducts });
        }
    }

    // =================================================================
    // CÁC CLASS DATA TRANSFER OBJECT (DTO) TRUNG GIAN DƯỚI ĐÂY
    // =================================================================

    public class AddSpentDto
    {
        public decimal Amount { get; set; }
    }

    public class UserResponse
    {
        public string Id { get; set; }
        public string Username { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Position { get; set; }
        public bool IsActive { get; set; }
        public int UserType { get; set; }
        public DateTime Created { get; set; }
        public decimal TotalSpent { get; set; }
        public int Tier { get; set; }
    }

    public class CreateUserRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Position { get; set; }
        public int UserType { get; set; }
    }

    public class UpdateUserRequest
    {
        public string Password { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Position { get; set; }
        public int? UserType { get; set; }
        public bool? IsActive { get; set; }
    }

    public class AddRestrictionDto
    {
        public string UserId { get; set; } = "";
        public string PaymentMethod { get; set; } = "";
    }

    // 🌿 DTO MỚI: Nhận thông tin trắc nghiệm da từ màn hình React Skin Test gửi xuống
    public class SkinQuizSubmitDto
    {
        public string SkinType { get; set; }
        public string MainConcern { get; set; }
        public string TexturePreference { get; set; }
    }
}