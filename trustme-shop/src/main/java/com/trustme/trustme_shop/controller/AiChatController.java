package com.trustme.trustme_shop.controller;

import com.trustme.trustme_shop.config.AiRateLimiter;
import com.trustme.trustme_shop.dto.AiChatRequest;
import com.trustme.trustme_shop.dto.AiChatResponse;
import com.trustme.trustme_shop.service.AiChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Chat", description = "AI Stylist chat API")
public class AiChatController {

    private static final int MAX_HISTORY_MESSAGES = 10;
    private static final int MAX_MESSAGE_LENGTH   = 500;

    private final AiChatService aiChatService;
    private final AiRateLimiter rateLimiter;

    @PostMapping("/chat")
    @Operation(summary = "Chat with AI Stylist")
    public ResponseEntity<?> chat(
            @RequestBody AiChatRequest request,
            HttpServletRequest httpRequest) {

        // 1. Rate limit by IP
        String ip = getClientIp(httpRequest);
        AiRateLimiter.LimitResult limit = rateLimiter.check(ip);
        if (limit == AiRateLimiter.LimitResult.MINUTE_EXCEEDED) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", "Bạn gửi quá nhiều tin nhắn. Vui lòng chờ 1 phút."));
        }
        if (limit == AiRateLimiter.LimitResult.HOUR_EXCEEDED) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", "Bạn đã dùng hết lượt chat hôm nay. Quay lại sau nhé!"));
        }

        // 2. Validate messages
        List<AiChatRequest.ChatMessage> messages = request.getMessages();
        if (messages == null || messages.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Tin nhắn không được để trống."));
        }

        // 3. Cap message length
        for (AiChatRequest.ChatMessage msg : messages) {
            if (msg.getContent() != null && msg.getContent().length() > MAX_MESSAGE_LENGTH) {
                msg.setContent(msg.getContent().substring(0, MAX_MESSAGE_LENGTH));
            }
        }

        // 4. Cap conversation history (keep last N messages to limit token usage)
        if (messages.size() > MAX_HISTORY_MESSAGES) {
            request.setMessages(messages.subList(messages.size() - MAX_HISTORY_MESSAGES, messages.size()));
        }

        return ResponseEntity.ok(aiChatService.chat(request));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

