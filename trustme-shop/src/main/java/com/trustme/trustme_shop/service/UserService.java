package com.trustme.trustme_shop.service;

import com.trustme.trustme_shop.dto.ChangePasswordRequest;
import com.trustme.trustme_shop.dto.ResetPasswordRequest;
import com.trustme.trustme_shop.dto.UpdateProfileRequest;
import com.trustme.trustme_shop.entity.User;
import com.trustme.trustme_shop.exception.AdminProtectedException;
import com.trustme.trustme_shop.exception.BadRequestException;
import com.trustme.trustme_shop.exception.ResourceNotFoundException;
import com.trustme.trustme_shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * UserService - Handles user management with RBAC protection
 * 
 * Business Rules:
 * - The initial ADMIN account (admin@trustme-shop.com) cannot be deleted
 * - The initial ADMIN account cannot have its role changed
 * - Email must be unique across all users
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    // Protected ADMIN email - cannot be deleted or downgraded
    private static final String PROTECTED_ADMIN_EMAIL = "admin@trustme-shop.com";

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public User createUser(User user) {
        // Check if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new BadRequestException("Email already exists: " + user.getEmail());
        }
        
        // Check if phone already exists
        if (user.getPhone() != null && userRepository.existsByPhone(user.getPhone())) {
            throw new BadRequestException("Phone number already exists: " + user.getPhone());
        }
        
        // Encode password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    /**
     * Updates user information
     * Prevents changing the role of the protected ADMIN account
     */
    @Transactional
    public User updateUser(Long id, User userDetails) {
        User user = getUserById(id);
        
        // Protect the initial ADMIN account from role changes
        if (PROTECTED_ADMIN_EMAIL.equals(user.getEmail()) && 
            userDetails.getRole() != null && 
            !"ADMIN".equals(userDetails.getRole())) {
            throw new AdminProtectedException(
                "Cannot change role of the protected ADMIN account: " + PROTECTED_ADMIN_EMAIL);
        }
        
        user.setFullName(userDetails.getFullName());
        user.setPhone(userDetails.getPhone());
        user.setAddress(userDetails.getAddress());
        
        // Only update role if provided and not protected admin
        if (userDetails.getRole() != null && !PROTECTED_ADMIN_EMAIL.equals(user.getEmail())) {
            user.setRole(userDetails.getRole());
        }
        
        return userRepository.save(user);
    }

    /**
     * Deletes a user by ID
     * 
     * CRITICAL BUSINESS RULE:
     * The initial ADMIN account (admin@trustme-shop.com) CANNOT be deleted
     * by anyone, including other admins or managers.
     * 
     * @throws AdminProtectedException if attempting to delete the protected ADMIN account
     */
    @Transactional
    public void deleteUser(Long id) {
        User user = getUserById(id);
        
        // Protect the initial ADMIN account from deletion
        if (PROTECTED_ADMIN_EMAIL.equals(user.getEmail())) {
            throw new AdminProtectedException(
                "Cannot delete the protected ADMIN account: " + PROTECTED_ADMIN_EMAIL + 
                ". This is the system's initial administrator and must remain in the database.");
        }
        
        userRepository.delete(user);
    }
    
    /**
     * Assigns MANAGER role to a user - Only ADMIN can do this
     * Protected via @PreAuthorize in controller
     */
    @Transactional
    public User assignManagerRole(Long userId) {
        User user = getUserById(userId);

        if ("ADMIN".equals(user.getRole())) {
            throw new BadRequestException("Cannot change role of an ADMIN user");
        }

        user.setRole("MANAGER");
        return userRepository.save(user);
    }

    /**
     * Changes the role of a user to MANAGER or CUSTOMER - ADMIN only
     * Cannot change role of the protected ADMIN account
     */
    @Transactional
    public User changeRole(Long userId, String newRole) {
        if (!"MANAGER".equals(newRole) && !"CUSTOMER".equals(newRole)) {
            throw new BadRequestException("Invalid role: " + newRole + ". Must be MANAGER or CUSTOMER");
        }
        User user = getUserById(userId);
        if ("ADMIN".equals(user.getRole())) {
            throw new AdminProtectedException("Cannot change role of an ADMIN user");
        }
        user.setRole(newRole);
        return userRepository.save(user);
    }

    /**
     * Updates phone and address for the currently authenticated user
     */
    @Transactional
    public User updateProfile(String email, UpdateProfileRequest request) {
        User user = getUserByEmail(email);

        if (request.getPhone() != null) {
            // Check phone uniqueness only if it changed
            if (!request.getPhone().equals(user.getPhone())
                    && userRepository.existsByPhone(request.getPhone())) {
                throw new BadRequestException("Phone number already in use: " + request.getPhone());
            }
            user.setPhone(request.getPhone());
        }

        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }

        return userRepository.save(user);
    }

    /**
     * Changes password for the current authenticated user
     * Requires old password verification
     */
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        // Validate new password matches confirm password
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }
        
        User user = getUserByEmail(email);
        
        // Verify old password
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BadRequestException("Old password is incorrect");
        }
        
        // Check if new password is same as old password
        if (request.getOldPassword().equals(request.getNewPassword())) {
            throw new BadRequestException("New password must be different from old password");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
    
    /**
     * Resets password for any user - ADMIN/MANAGER only
     * Does not require old password
     */
    @Transactional
    public void resetPassword(Long userId, ResetPasswordRequest request) {
        User user = getUserById(userId);
        
        // Protect the initial ADMIN account
        if (PROTECTED_ADMIN_EMAIL.equals(user.getEmail())) {
            throw new AdminProtectedException(
                "Cannot reset password of the protected ADMIN account: " + PROTECTED_ADMIN_EMAIL);
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
