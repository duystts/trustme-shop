package com.trustme.trustme_shop.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    @Pattern(regexp = "^(0|\\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$",
             message = "Phone number must be a valid Vietnamese phone number")
    private String phone;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;
}
