package com.trustme.trustme_shop.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustme.trustme_shop.dto.ImportResult;
import com.trustme.trustme_shop.dto.ProductRequest;
import com.trustme.trustme_shop.entity.Category;
import com.trustme.trustme_shop.entity.Product;
import com.trustme.trustme_shop.entity.ProductOption;
import com.trustme.trustme_shop.entity.ProductOptionValue;
import com.trustme.trustme_shop.entity.ProductVariant;
import com.trustme.trustme_shop.exception.ResourceNotFoundException;
import com.trustme.trustme_shop.repository.CategoryRepository;
import com.trustme.trustme_shop.repository.ProductOptionRepository;
import com.trustme.trustme_shop.repository.ProductRepository;
import com.trustme.trustme_shop.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final CategoryRepository categoryRepository;
    private final ProductOptionRepository productOptionRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    public List<Product> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    public List<Product> searchProductsByName(String name) {
        return productRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Product> getProductsByPriceRange(Double minPrice, Double maxPrice) {
        return productRepository.findByPriceBetween(minPrice, maxPrice);
    }

    public List<Product> getRelatedProducts(Long productId, int limit) {
        Product product = getProductById(productId);

        if (product.getCategories() == null || product.getCategories().isEmpty()) {
            return List.of();
        }

        Long categoryId = product.getCategories().get(0).getId();
        List<Product> productsInSameCategory = productRepository.findByCategoryId(categoryId);

        return productsInSameCategory.stream()
                .filter(p -> !p.getId().equals(productId))
                .limit(limit)
                .toList();
    }

    @Transactional
    public Product createProduct(ProductRequest request) {
        List<Category> categories = new ArrayList<>();
        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            categories = request.getCategoryIds().stream()
                    .map(categoryService::getCategoryById)
                    .collect(Collectors.toList());
        }
        
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .categories(categories)
                .build();
        
        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, ProductRequest request) {
        Product product = getProductById(id);
        
        List<Category> categories = new ArrayList<>();
        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            categories = request.getCategoryIds().stream()
                    .map(categoryService::getCategoryById)
                    .collect(Collectors.toList());
        }
        
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setCategories(categories);
        
        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }

    @Transactional
    public ImportResult importFromCsv(MultipartFile file) {
        List<ImportResult.ImportError> errors = new ArrayList<>();
        int success = 0;
        int rowNum = 1; // row 1 = header

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            // Skip header row
            String header = reader.readLine();
            if (header == null) {
                errors.add(ImportResult.ImportError.builder().row(0).message("File trống").build());
                return ImportResult.builder().success(0).failed(0).errors(errors).build();
            }

            String line;
            while ((line = reader.readLine()) != null) {
                rowNum++;
                // Skip BOM if present on first data line
                line = line.replace("\uFEFF", "").trim();
                if (line.isEmpty()) continue;

                try {
                    String[] cols = parseCsvLine(line);
                    if (cols.length < 3) {
                        errors.add(ImportResult.ImportError.builder().row(rowNum)
                                .message("Thiếu cột bắt buộc (name, price)").build());
                        continue;
                    }

                    String name = cols[0].trim();
                    String description = cols.length > 1 ? cols[1].trim() : "";
                    String priceStr = cols[2].trim();
                    String stockStr = cols.length > 3 ? cols[3].trim() : "0";
                    String categoryNamesStr = cols.length > 4 ? cols[4].trim() : "";

                    if (name.isEmpty()) {
                        errors.add(ImportResult.ImportError.builder().row(rowNum)
                                .message("Tên sản phẩm không được để trống").build());
                        continue;
                    }

                    double price;
                    try {
                        price = Double.parseDouble(priceStr.replace(",", ""));
                        if (price <= 0) throw new NumberFormatException();
                    } catch (NumberFormatException e) {
                        errors.add(ImportResult.ImportError.builder().row(rowNum)
                                .message("Giá không hợp lệ: '" + priceStr + "'").build());
                        continue;
                    }

                    int stock = 0;
                    if (!stockStr.isEmpty()) {
                        try {
                            stock = Integer.parseInt(stockStr.replace(",", ""));
                        } catch (NumberFormatException e) {
                            errors.add(ImportResult.ImportError.builder().row(rowNum)
                                    .message("Tồn kho không hợp lệ: '" + stockStr + "'").build());
                            continue;
                        }
                    }

                    List<Category> categories = new ArrayList<>();
                    if (!categoryNamesStr.isEmpty()) {
                        boolean categoryError = false;
                        for (String catName : categoryNamesStr.split(";")) {
                            String trimmed = catName.trim();
                            if (trimmed.isEmpty()) continue;
                            var cat = categoryRepository.findByName(trimmed);
                            if (cat.isEmpty()) {
                                errors.add(ImportResult.ImportError.builder().row(rowNum)
                                        .message("Danh mục không tồn tại: '" + trimmed + "'").build());
                                categoryError = true;
                                break;
                            }
                            categories.add(cat.get());
                        }
                        if (categoryError) continue;
                    }

                    Product product = Product.builder()
                            .name(name)
                            .description(description.isEmpty() ? null : description)
                            .price(price)
                            .stockQuantity(stock)
                            .categories(categories)
                            .build();
                    productRepository.save(product);
                    success++;

                } catch (Exception e) {
                    errors.add(ImportResult.ImportError.builder().row(rowNum)
                            .message("Lỗi xử lý: " + e.getMessage()).build());
                }
            }
        } catch (Exception e) {
            errors.add(ImportResult.ImportError.builder().row(0)
                    .message("Không đọc được file: " + e.getMessage()).build());
        }

        return ImportResult.builder()
                .success(success)
                .failed(errors.size())
                .errors(errors)
                .build();
    }

    @Transactional
    public ImportResult importFromExcel(MultipartFile file) {
        List<ImportResult.ImportError> errors = new ArrayList<>();
        int success = 0;

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            // Skip header row
            if (rows.hasNext()) rows.next();

            while (rows.hasNext()) {
                Row row = rows.next();
                int rowNum = row.getRowNum() + 1;

                // Skip fully blank rows
                if (isRowEmpty(row)) continue;

                try {
                    String name = getCellString(row, 0);
                    String description = getCellString(row, 1);
                    String priceStr = getCellString(row, 2);
                    String stockStr = getCellString(row, 3);
                    String categoryNamesStr = getCellString(row, 4);

                    if (name.isEmpty()) {
                        errors.add(ImportResult.ImportError.builder().row(rowNum).message("Tên sản phẩm không được để trống").build());
                        continue;
                    }

                    double price;
                    try {
                        price = Double.parseDouble(priceStr.replace(",", ""));
                        if (price <= 0) throw new NumberFormatException();
                    } catch (NumberFormatException e) {
                        errors.add(ImportResult.ImportError.builder().row(rowNum).message("Giá không hợp lệ: '" + priceStr + "'").build());
                        continue;
                    }

                    int stock = 0;
                    if (!stockStr.isEmpty()) {
                        try {
                            stock = (int) Double.parseDouble(stockStr.replace(",", ""));
                        } catch (NumberFormatException e) {
                            errors.add(ImportResult.ImportError.builder().row(rowNum).message("Tồn kho không hợp lệ: '" + stockStr + "'").build());
                            continue;
                        }
                    }

                    List<Category> categories = new ArrayList<>();
                    if (!categoryNamesStr.isEmpty()) {
                        boolean categoryError = false;
                        for (String catName : categoryNamesStr.split(";")) {
                            String trimmed = catName.trim();
                            if (trimmed.isEmpty()) continue;
                            var cat = categoryRepository.findByName(trimmed);
                            if (cat.isEmpty()) {
                                errors.add(ImportResult.ImportError.builder().row(rowNum).message("Danh mục không tồn tại: '" + trimmed + "'").build());
                                categoryError = true;
                                break;
                            }
                            categories.add(cat.get());
                        }
                        if (categoryError) continue;
                    }

                    String optionNamesStr = getCellString(row, 5);   // e.g. "Size;Màu sắc"
                    String optionValuesStr = getCellString(row, 6);  // e.g. "S;M;L|Đỏ;Xanh"

                    Product saved = productRepository.save(Product.builder()
                            .name(name)
                            .description(description.isEmpty() ? null : description)
                            .price(price)
                            .stockQuantity(stock)
                            .categories(categories)
                            .build());

                    // Parse & create options/variants if provided
                    if (!optionNamesStr.isEmpty()) {
                        String[] optNames = optionNamesStr.split(";");
                        String[] optValueGroups = optionValuesStr.split("\\|", -1);

                        List<ProductOption> createdOptions = new ArrayList<>();
                        for (int i = 0; i < optNames.length; i++) {
                            String optName = optNames[i].trim();
                            if (optName.isEmpty()) continue;

                            String valuesRaw = (i < optValueGroups.length) ? optValueGroups[i] : "";
                            List<ProductOptionValue> vals = new ArrayList<>();
                            ProductOption opt = ProductOption.builder()
                                    .name(optName).product(saved).values(vals).build();
                            for (String v : valuesRaw.split(";")) {
                                String vTrimmed = v.trim();
                                if (!vTrimmed.isEmpty())
                                    vals.add(ProductOptionValue.builder().value(vTrimmed).option(opt).build());
                            }
                            createdOptions.add(productOptionRepository.save(opt));
                        }

                        // Auto-generate all variant combinations (Cartesian product)
                        List<Map<String, String>> combos = new ArrayList<>();
                        combos.add(new LinkedHashMap<>());
                        for (ProductOption opt : createdOptions) {
                            List<Map<String, String>> next = new ArrayList<>();
                            for (Map<String, String> existing : combos) {
                                for (ProductOptionValue val : opt.getValues()) {
                                    Map<String, String> combo = new LinkedHashMap<>(existing);
                                    combo.put(opt.getName(), val.getValue());
                                    next.add(combo);
                                }
                            }
                            combos = next;
                        }
                        for (Map<String, String> combo : combos) {
                            productVariantRepository.save(ProductVariant.builder()
                                    .product(saved)
                                    .combination(objectMapper.writeValueAsString(combo))
                                    .stockQuantity(0)
                                    .build());
                        }
                    }

                    success++;

                } catch (Exception e) {
                    errors.add(ImportResult.ImportError.builder().row(rowNum).message("Lỗi xử lý: " + e.getMessage()).build());
                }
            }
        } catch (Exception e) {
            errors.add(ImportResult.ImportError.builder().row(0).message("Không đọc được file: " + e.getMessage()).build());
        }

        return ImportResult.builder().success(success).failed(errors.size()).errors(errors).build();
    }

    public byte[] generateExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // ---- Sheet 1: Products data ----
            Sheet sheet = workbook.createSheet("Products");

            CellStyle headerStyle = workbook.createCellStyle();
            Font boldFont = workbook.createFont();
            boldFont.setBold(true);
            headerStyle.setFont(boldFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle optionHeaderStyle = workbook.createCellStyle();
            Font optFont = workbook.createFont();
            optFont.setBold(true);
            optionHeaderStyle.setFont(optFont);
            optionHeaderStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            optionHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] cols = {"name", "description", "price", "stockQuantity", "categoryNames",
                             "optionNames", "optionValues"};
            Row header = sheet.createRow(0);
            for (int i = 0; i < cols.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(cols[i]);
                cell.setCellStyle(i < 5 ? headerStyle : optionHeaderStyle);
                sheet.setColumnWidth(i, i >= 5 ? 7000 : 5000);
            }

            // Sample rows (col 5 = optionNames, col 6 = optionValues pipe-separated groups)
            Object[][] samples = {
                {"Áo thun nam",    "Chất liệu cotton thoáng mát", 299000, 100, "Men",                "Size;Màu sắc", "S;M;L;XL|Trắng;Đen;Xanh"},
                {"Quần jean nữ",   "Slim fit co giãn",             599000, 50,  "Women;New Arrivals", "Size",         "25;26;27;28;29"},
                {"Váy maxi hoa",   "Chất liệu lụa mát",            450000, 80,  "Women",              "",             ""},
            };
            for (int r = 0; r < samples.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < samples[r].length; c++) {
                    Cell cell = row.createCell(c);
                    if (samples[r][c] instanceof Number) {
                        cell.setCellValue(((Number) samples[r][c]).doubleValue());
                    } else {
                        cell.setCellValue(String.valueOf(samples[r][c]));
                    }
                }
            }

            // ---- Sheet 2: Hướng dẫn ----
            Sheet guide = workbook.createSheet("Hướng dẫn");
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 12);
            titleStyle.setFont(titleFont);

            String[][] guideRows = {
                {"Cột", "Tên cột", "Bắt buộc", "Mô tả / Ví dụ"},
                {"A", "name",          "✓", "Tên sản phẩm"},
                {"B", "description",   "",  "Mô tả sản phẩm"},
                {"C", "price",         "✓", "Giá (VD: 299000)"},
                {"D", "stockQuantity", "",  "Tồn kho mặc định (VD: 100)"},
                {"E", "categoryNames", "",  "Tên danh mục, nhiều danh mục cách nhau dấu ; (VD: Men;New Arrivals)"},
                {"F", "optionNames",   "",  "Tên các tùy chọn, cách nhau dấu ; (VD: Size;Màu sắc)"},
                {"G", "optionValues",  "",  "Giá trị mỗi tùy chọn: nhóm cách nhau | , giá trị trong nhóm cách ; (VD: S;M;L|Đỏ;Xanh)"},
                {"", "", "", "Hệ thống sẽ tự sinh tất cả biến thể (variants) từ tổ hợp các tùy chọn."},
            };
            for (int r = 0; r < guideRows.length; r++) {
                Row row = guide.createRow(r);
                for (int c = 0; c < guideRows[r].length; c++) {
                    Cell cell = row.createCell(c);
                    cell.setCellValue(guideRows[r][c]);
                    if (r == 0) cell.setCellStyle(titleStyle);
                    guide.setColumnWidth(c, c == 3 ? 18000 : 5000);
                }
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Cannot generate Excel template", e);
        }
    }

    private String getCellString(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case NUMERIC -> {
                double v = cell.getNumericCellValue();
                yield v == Math.floor(v) ? String.valueOf((long) v) : String.valueOf(v);
            }
            case STRING -> cell.getStringCellValue().trim();
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCachedFormulaResultType() == CellType.NUMERIC
                    ? String.valueOf((long) cell.getNumericCellValue())
                    : cell.getRichStringCellValue().getString().trim();
            default -> "";
        };
    }

    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK
                    && !cell.toString().trim().isEmpty()) return false;
        }
        return true;
    }

    /** Parse a single CSV line, handling quoted fields (e.g. "Men;Women") */
    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();
        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());
        return result.toArray(new String[0]);
    }
}
