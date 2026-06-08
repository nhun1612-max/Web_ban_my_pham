using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepository _productRepository;
        private readonly ICategoryRepository _categoryRepository;

        // 🟢 Đã bỏ AppDbContext đi vì cách này không cần chọc sâu vào SQL nữa
        public ProductsController(IProductRepository productRepository, ICategoryRepository categoryRepository)
        {
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
             [FromQuery] string? keyword,
             [FromQuery] int? categoryId,
             [FromQuery] int? supplierId,
             [FromQuery] int? minStock,
             [FromQuery] int? maxStock,
             [FromQuery] decimal? minProfit,
             [FromQuery] DateTime? expiryBefore,
             [FromQuery] decimal? minPrice,
             [FromQuery] decimal? maxPrice,
             [FromQuery] string? sortBy,
             [FromQuery] string? brand,
             [FromQuery] string? skinType,
             [FromQuery] int page = 1,
             [FromQuery] int pageSize = 10)
        {
            var (products, totalCount) = await _productRepository.SearchAsync(
                keyword, categoryId, supplierId, brand, skinType, minStock, maxStock, minProfit,
                expiryBefore, minPrice, maxPrice, sortBy, page, pageSize);

            var productDtos = products.Select(p => new ProductResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                ImportPrice = p.ImportPrice,
                Stock = p.Stock,
                CategoryId = p.CategoryId,
                CategoryName = p.Category?.Name ?? "---",
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier?.Name ?? "---",
                Description = p.Description,
                ExpiryDate = p.ExpiryDate,
                Volume = p.Volume,
                Origin = p.Origin,
                Brand = p.Brand,
                SkinType = p.SkinType,
                Formulation = p.Formulation,
                AvailableVolumes = p.AvailableVolumes,
                VideoUrl = p.VideoUrl,
                ImageUrl = p.ImageUrl ?? "",
                GalleryImages = string.IsNullOrEmpty(p.GalleryImageUrls)
                                ? new List<string>()
                                : p.GalleryImageUrls.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).ToList(),

                // 🟢 CẮT CHUỖI TỪ CỘT VariantsData THÀNH MẢNG CHO REACT
                Variants = string.IsNullOrEmpty(p.VariantsData)
                    ? new List<VariantDto>()
                    : p.VariantsData.Split(',', StringSplitOptions.RemoveEmptyEntries).Select((v, index) =>
                    {
                        var parts = v.Split('|');
                        return new VariantDto
                        {
                            Id = index + 1, // Tạo ID ảo cho React làm key
                            Name = parts[0],
                            Price = parts.Length > 1 && decimal.TryParse(parts[1], out var price) ? price : 0,
                            Stock = parts.Length > 2 && int.TryParse(parts[2], out var stock) ? stock : 0
                        };
                    }).ToList()
            }).ToList();

            return Ok(new
            {
                items = productDtos,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            var dto = new ProductResponseDto
            {
                Id = product.Id,
                Name = product.Name,
                Price = product.Price,
                ImportPrice = product.ImportPrice,
                Stock = product.Stock,
                CategoryId = product.CategoryId,
                CategoryName = product.Category?.Name ?? "---",
                SupplierId = product.SupplierId,
                SupplierName = product.Supplier?.Name ?? "---",
                Description = product.Description,
                ExpiryDate = product.ExpiryDate,
                Volume = product.Volume,
                Origin = product.Origin,
                Brand = product.Brand,
                SkinType = product.SkinType,
                Formulation = product.Formulation,
                AvailableVolumes = product.AvailableVolumes,
                VideoUrl = product.VideoUrl,
                ImageUrl = product.ImageUrl ?? "",
                GalleryImages = string.IsNullOrEmpty(product.GalleryImageUrls)
                                ? new List<string>()
                                : product.GalleryImageUrls.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).ToList(),
                AverageRating = product.Reviews != null && product.Reviews.Any()
                    ? Math.Round(product.Reviews.Average(r => r.Rating), 1)
                    : 0.0, // Nếu chưa có ai đánh giá thì hiện 0 sao

                SoldQuantity = product.OrderDetails != null
                    ? product.OrderDetails.Sum(od => od.Quantity)
                    : 0,

                Reviews = product.Reviews?.OrderByDescending(r => r.CreatedAt).Select(r => new ReviewDto
                {
                    Id = r.Id,
                    CustomerName = r.CustomerName,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,

                    // 🟢 THÊM ĐOẠN NÀY ĐỂ TÁCH CHUỖI ẢNH TỪ DATABASE THÀNH MẢNG
                    Images = string.IsNullOrEmpty(r.ReviewImageUrls)
                              ? new List<string>()
                              : r.ReviewImageUrls.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(img => img.Trim()).ToList()
                }).ToList() ?? new List<ReviewDto>(),

                // 🟢 CẮT CHUỖI TỪ CỘT VariantsData THÀNH MẢNG CHO REACT
                Variants = string.IsNullOrEmpty(product.VariantsData)
                    ? new List<VariantDto>()
                    : product.VariantsData.Split(',', StringSplitOptions.RemoveEmptyEntries).Select((v, index) =>
                    {
                        var parts = v.Split('|');
                        return new VariantDto
                        {
                            Id = index + 1, // Tạo ID ảo cho React làm key
                            Name = parts[0],
                            Price = parts.Length > 1 && decimal.TryParse(parts[1], out var price) ? price : 0,
                            Stock = parts.Length > 2 && int.TryParse(parts[2], out var stock) ? stock : 0
                        };
                    }).ToList()
            };

            return Ok(dto);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            try
            {
                var category = await _categoryRepository.GetByIdAsync(dto.CategoryId);
                if (category == null)
                    return BadRequest(new { message = "Category not found" });

                var product = new Product
                {
                    Name = dto.Name,
                    Price = dto.Price,
                    ImportPrice = dto.ImportPrice,
                    Stock = dto.Stock,
                    CategoryId = dto.CategoryId,
                    SupplierId = dto.SupplierId ?? 0,
                    Description = dto.Description,
                    ExpiryDate = dto.ExpiryDate,
                    Volume = dto.Volume,
                    Origin = dto.Origin,
                    Brand = dto.Brand,
                    SkinType = dto.SkinType,
                    Formulation = dto.Formulation,
                    AvailableVolumes = dto.AvailableVolumes,
                    VideoUrl = dto.VideoUrl,
                    ImageUrl = dto.ImageUrl,
                    GalleryImageUrls = dto.GalleryImages,

                    // 🟢 NỐI MẢNG THÀNH CHUỖI ĐỂ LƯU VÀO CỘT MỚI
                    VariantsData = dto.Variants != null && dto.Variants.Any()
                        ? string.Join(",", dto.Variants.Select(v => $"{v.Name}|{v.Price}|{v.Stock}"))
                        : ""
                };

                await _productRepository.AddAsync(product);

                return Ok(new { message = "Thêm sản phẩm thành công", id = product.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"LỖI C#: {ex.Message}" });
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto dto)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(id);
                if (product == null)
                    return NotFound(new { message = "Product not found" });

                product.Name = dto.Name ?? product.Name;
                product.Price = dto.Price ?? product.Price;
                product.ImportPrice = dto.ImportPrice ?? product.ImportPrice;
                product.Stock = dto.Stock ?? product.Stock;
                product.CategoryId = dto.CategoryId ?? product.CategoryId;
                product.SupplierId = dto.SupplierId ?? product.SupplierId;
                product.Description = dto.Description ?? product.Description;
                product.ExpiryDate = dto.ExpiryDate ?? product.ExpiryDate;
                product.Volume = dto.Volume ?? product.Volume;
                product.Origin = dto.Origin ?? product.Origin;
                product.Brand = dto.Brand ?? product.Brand;
                product.SkinType = dto.SkinType ?? product.SkinType;
                product.Formulation = dto.Formulation ?? product.Formulation;
                product.AvailableVolumes = dto.AvailableVolumes ?? product.AvailableVolumes;
                product.VideoUrl = dto.VideoUrl ?? product.VideoUrl;
                product.ImageUrl = dto.ImageUrl ?? product.ImageUrl;
                product.GalleryImageUrls = dto.GalleryImages ?? product.GalleryImageUrls;

                // 🟢 NỐI MẢNG THÀNH CHUỖI ĐỂ GHI ĐÈ
                if (dto.Variants != null)
                {
                    product.VariantsData = dto.Variants.Any()
                        ? string.Join(",", dto.Variants.Select(v => $"{v.Name}|{v.Price}|{v.Stock}"))
                        : "";
                }

                await _productRepository.UpdateAsync(product);

                return Ok(new { message = "Cập nhật sản phẩm thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"LỖI C#: {ex.Message}" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            await _productRepository.DeleteAsync(product);
            return Ok(new { message = "Product deleted successfully" });
        }

        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var products = await _productRepository.GetByCategoryAsync(categoryId);

            var productDtos = products.Select(p => new ProductResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                ImportPrice = p.ImportPrice,
                Stock = p.Stock,
                CategoryId = p.CategoryId,
                CategoryName = p.Category?.Name ?? "---",
                ImageUrl = p.ImageUrl ?? ""
            }).ToList();

            return Ok(productDtos);
        }
    }

    public class ProductCreateDto
    {
        public string Name { get; set; } = "";
        public decimal Price { get; set; }
        public decimal ImportPrice { get; set; }
        public int Stock { get; set; }
        public int CategoryId { get; set; }
        public int? SupplierId { get; set; }
        public string? Description { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? Volume { get; set; }
        public string? Origin { get; set; }
        public string? Brand { get; set; }
        public string? SkinType { get; set; }
        public string? Formulation { get; set; }
        public string? AvailableVolumes { get; set; }
        public string? VideoUrl { get; set; }
        public string? ImageUrl { get; set; }
        public string? GalleryImages { get; set; }
        public List<VariantDto>? Variants { get; set; }
    }

    public class ProductUpdateDto
    {
        public string? Name { get; set; }
        public decimal? Price { get; set; }
        public decimal? ImportPrice { get; set; }
        public int? Stock { get; set; }
        public int? CategoryId { get; set; }
        public int? SupplierId { get; set; }
        public string? Description { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? Volume { get; set; }
        public string? Origin { get; set; }
        public string? Brand { get; set; }
        public string? SkinType { get; set; }
        public string? Formulation { get; set; }
        public string? AvailableVolumes { get; set; }
        public string? VideoUrl { get; set; }
        public string? ImageUrl { get; set; }
        public string? GalleryImages { get; set; }
        public List<VariantDto>? Variants { get; set; }
    }

    public class ProductResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public decimal Price { get; set; }
        public decimal ImportPrice { get; set; }
        public int Stock { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = "";
        public int? SupplierId { get; set; }
        public string SupplierName { get; set; } = "";
        public string? Description { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? ImageUrl { get; set; }
        public string? Volume { get; set; }
        public string? Origin { get; set; }
        public string? Brand { get; set; }
        public string? SkinType { get; set; }
        public string? Formulation { get; set; }
        public string? AvailableVolumes { get; set; }
        public string? VideoUrl { get; set; }
        public double AverageRating { get; set; }
        public int SoldQuantity { get; set; }

        public List<VariantDto> Variants { get; set; } = new List<VariantDto>();
        public List<ReviewDto> Reviews { get; set; } = new List<ReviewDto>();
        public List<string> GalleryImages { get; set; } = new List<string>();
    }

    public class ReviewDto
    {
        public int Id { get; set; }
        public string CustomerName { get; set; } = "";
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<string> Images { get; set; } = new List<string>();
    }

    public class VariantDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public decimal Price { get; set; }
        public int Stock { get; set; }
    }
}