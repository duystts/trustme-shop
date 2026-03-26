package com.trustme.trustme_shop.constant;

public class ValidationMessages {
    
    // User validation messages
    public static final String FULL_NAME_REQUIRED = "Full name is required";
    public static final String FULL_NAME_SIZE = "Full name must be between 2 and 100 characters";
    public static final String FULL_NAME_FORMAT = "Full name must contain only letters and spaces";
    
    public static final String EMAIL_REQUIRED = "Email is required";
    public static final String EMAIL_INVALID = "Email must be valid";
    public static final String EMAIL_FORMAT = "Email format is invalid";
    public static final String EMAIL_EXISTS = "Email already exists";
    
    public static final String PASSWORD_REQUIRED = "Password is required";
    public static final String PASSWORD_SIZE = "Password must be between 6 and 100 characters";
    public static final String PASSWORD_STRENGTH = "Password must contain at least one letter and one number";
    
    public static final String PHONE_REQUIRED = "Phone number is required";
    public static final String PHONE_FORMAT = "Phone number must be a valid Vietnamese phone number (10 digits starting with 0 or +84)";
    public static final String PHONE_EXISTS = "Phone number already exists";
    
    public static final String ADDRESS_SIZE = "Address must not exceed 500 characters";
    
    public static final String ROLE_REQUIRED = "Role is required";
    public static final String ROLE_INVALID = "Role must be either USER, CUSTOMER, ADMIN or MANAGER";
    
    // Product validation messages
    public static final String PRODUCT_NAME_REQUIRED = "Product name is required";
    public static final String PRODUCT_NAME_SIZE = "Product name must be between 3 and 255 characters";
    public static final String PRODUCT_DESCRIPTION_SIZE = "Description must not exceed 2000 characters";
    public static final String PRODUCT_PRICE_REQUIRED = "Price is required";
    public static final String PRODUCT_PRICE_POSITIVE = "Price must be greater than 0";
    public static final String PRODUCT_STOCK_POSITIVE = "Stock quantity cannot be negative";
    public static final String CATEGORY_ID_REQUIRED = "Category ID is required";
    
    // Category validation messages
    public static final String CATEGORY_NAME_REQUIRED = "Category name is required";
    public static final String CATEGORY_NAME_SIZE = "Category name must be between 2 and 100 characters";
    public static final String CATEGORY_DESCRIPTION_SIZE = "Description must not exceed 500 characters";
    
    private ValidationMessages() {
        // Private constructor to prevent instantiation
    }
}
