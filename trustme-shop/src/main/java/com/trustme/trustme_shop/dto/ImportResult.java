package com.trustme.trustme_shop.dto;

import lombok.*;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ImportResult {

    private int success;
    private int failed;
    private List<ImportError> errors;

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ImportError {
        private int row;
        private String message;
    }
}
