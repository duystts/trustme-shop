package com.trustme.trustme_shop.controller;

import com.trustme.trustme_shop.dto.ImportResult;
import com.trustme.trustme_shop.dto.ProductRequest;
import com.trustme.trustme_shop.entity.Product;
import com.trustme.trustme_shop.service.ProductImageService;
import com.trustme.trustme_shop.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Product", description = "Product management APIs")
public class ProductController {

    private final ProductService productService;
    private final ProductImageService productImageService;

    @GetMapping
    @Operation(summary = "Get all products", description = "Retrieve all products with pagination and sorting")
    public ResponseEntity<Page<Product>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        String[] sortParams = sort.split(",");
        String sortField = sortParams[0];
        String sortDirection = sortParams.length > 1 ? sortParams[1] : "desc";

        Sort sortObj = Sort.by(Sort.Direction.fromString(sortDirection), sortField);
        Pageable pageable = PageRequest.of(page, size, sortObj);

        return ResponseEntity.ok(productService.getAllProducts(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID", description = "Retrieve a specific product by its ID")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/{id}/related")
    @Operation(summary = "Get related products", description = "Retrieve products related to the given product (same category)")
    public ResponseEntity<List<Product>> getRelatedProducts(
            @PathVariable Long id,
            @RequestParam(defaultValue = "4") int limit
    ) {
        return ResponseEntity.ok(productService.getRelatedProducts(id, limit));
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Get products by category", description = "Retrieve all products in a specific category")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(productService.getProductsByCategory(categoryId));
    }

    @GetMapping("/search")
    @Operation(summary = "Search products", description = "Search products by name (case-insensitive)")
    public ResponseEntity<List<Product>> searchProducts(@RequestParam String name) {
        return ResponseEntity.ok(productService.searchProductsByName(name));
    }

    @GetMapping("/price-range")
    @Operation(summary = "Get products by price range", description = "Filter products by minimum and maximum price")
    public ResponseEntity<List<Product>> getProductsByPriceRange(
            @RequestParam Double minPrice,
            @RequestParam Double maxPrice) {
        return ResponseEntity.ok(productService.getProductsByPriceRange(minPrice, maxPrice));
    }

    @PostMapping
    @Operation(summary = "Create product", description = "Create a new product")
    public ResponseEntity<Product> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.createProduct(request));
    }

    @PostMapping(value = "/with-images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Create product with images", description = "Create a new product and upload images in a single request")
    public ResponseEntity<Product> createProductWithImages(
            @RequestPart("product") @Valid ProductRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        Product product = productService.createProduct(request);
        if (images != null) {
            images.forEach(file -> productImageService.uploadProductImage(product.getId(), file));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.getProductById(product.getId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update product", description = "Update an existing product")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product", description = "Delete a product by ID")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/import/template")
    @Operation(summary = "Download CSV template", description = "Download a CSV template for bulk product import")
    public ResponseEntity<byte[]> downloadImportTemplate() {
        String csv = "name,description,price,stockQuantity,categoryNames\n"
                   + "Áo thun nam,Chất liệu cotton thoáng mát,299000,100,Men\n"
                   + "Quần jean nữ,Slim fit co giãn,599000,50,\"Women;New Arrivals\"\n";
        byte[] bytes = csv.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"product-import-template.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }

    @PostMapping(value = "/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import products from CSV", description = "Bulk import products from a CSV file")
    public ResponseEntity<ImportResult> importCsv(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(productService.importFromCsv(file));
    }

    @GetMapping("/import/template/excel")
    @Operation(summary = "Download Excel template", description = "Download an Excel (.xlsx) template for bulk product import")
    public ResponseEntity<byte[]> downloadExcelTemplate() {
        byte[] bytes = productService.generateExcelTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"product-import-template.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @PostMapping(value = "/import/excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import products from Excel", description = "Bulk import products from an Excel (.xlsx) file")
    public ResponseEntity<ImportResult> importExcel(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(productService.importFromExcel(file));
    }
}
