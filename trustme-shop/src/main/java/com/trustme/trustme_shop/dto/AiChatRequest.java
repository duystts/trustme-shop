package com.trustme.trustme_shop.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AiChatRequest {

    private List<ChatMessage> messages;

    @Getter
    @Setter
    public static class ChatMessage {
        private String role;    // "user" or "assistant"
        private String content;
    }
}
