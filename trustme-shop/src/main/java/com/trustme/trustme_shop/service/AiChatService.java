package com.trustme.trustme_shop.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.trustme.trustme_shop.dto.AiChatRequest;
import com.trustme.trustme_shop.dto.AiChatResponse;
import com.trustme.trustme_shop.entity.Category;
import com.trustme.trustme_shop.entity.Product;
import com.trustme.trustme_shop.repository.CategoryRepository;
import com.trustme.trustme_shop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiChatService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    // Provider: "gemini" or "groq"
    @Value("${ai.provider:gemini}")
    private String provider;

    @Value("${ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${ai.gemini.model:gemini-2.5-flash-lite}")
    private String geminiModel;

    @Value("${ai.groq.api-key:}")
    private String groqApiKey;

    @Value("${ai.groq.model:llama-3.3-70b-versatile}")
    private String groqModel;

    private static final Pattern PRODUCT_PATTERN = Pattern.compile("\\[PRODUCT:([^]]+)]");

    public AiChatResponse chat(AiChatRequest request) {
        List<Category> categories = categoryRepository.findAll();
        String systemPrompt = buildSystemPrompt(categories);

        try {
            String rawReply = "groq".equalsIgnoreCase(provider)
                    ? callGroq(systemPrompt, request.getMessages())
                    : callGemini(systemPrompt, request.getMessages());

            return parseReply(rawReply);
        } catch (Exception e) {
            return AiChatResponse.builder()
                    .reply("Xin lỗi, tôi đang gặp sự cố kỹ thuật. Bạn thử lại sau nhé! 🙏")
                    .build();
        }
    }

    // ── Build system prompt ──────────────────────────────────────────────────

    private String buildSystemPrompt(List<Category> categories) {
        String catList = categories.stream()
                .map(Category::getName)
                .collect(Collectors.joining(", "));

        return """
                Bạn là AI Stylist của trustme-shop — cửa hàng thời trang online tại Việt Nam.
                Nhiệm vụ: tư vấn outfit và gợi ý sản phẩm phù hợp cho khách hàng.

                Danh mục sản phẩm hiện có: %s

                Quy tắc:
                - Trả lời thân thiện, ngắn gọn bằng tiếng Việt.
                - Khi muốn gợi ý một sản phẩm cụ thể, thêm marker [PRODUCT:từ_khóa] vào CUỐI tin nhắn.
                  Ví dụ: "Mình gợi ý bạn chiếc áo thun này nhé! [PRODUCT:áo thun nam]"
                - Chỉ dùng [PRODUCT:...] khi thực sự muốn hiển thị sản phẩm, tối đa 1 sản phẩm mỗi câu trả lời.
                - Nếu không tìm được sản phẩm phù hợp thì không dùng marker.
                - Đừng bịa đặt tên sản phẩm — chỉ dùng từ khóa tổng quát (ví dụ: "áo thun", "quần jean").
                """.formatted(catList.isEmpty() ? "Đang cập nhật" : catList);
    }

    // ── Gemini API ───────────────────────────────────────────────────────────

    private String callGemini(String systemPrompt, List<AiChatRequest.ChatMessage> messages) throws Exception {
        if (geminiApiKey.isBlank()) throw new IllegalStateException("Gemini API key not configured");

        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel + ":generateContent?key=" + geminiApiKey;

        ObjectNode body = objectMapper.createObjectNode();

        // system instruction
        ObjectNode sysInstr = objectMapper.createObjectNode();
        ArrayNode sysParts = sysInstr.putArray("parts");
        sysParts.addObject().put("text", systemPrompt);
        body.set("system_instruction", sysInstr);

        // conversation contents
        ArrayNode contents = body.putArray("contents");
        for (AiChatRequest.ChatMessage msg : messages) {
            ObjectNode entry = objectMapper.createObjectNode();
            // Gemini uses "model" for assistant role
            entry.put("role", "assistant".equals(msg.getRole()) ? "model" : "user");
            ArrayNode parts = entry.putArray("parts");
            parts.addObject().put("text", msg.getContent());
            contents.add(entry);
        }

        // generation config
        ObjectNode genConfig = body.putObject("generationConfig");
        genConfig.put("maxOutputTokens", 512);
        genConfig.put("temperature", 0.8);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<String> response = restTemplate.postForEntity(
                url, new HttpEntity<>(objectMapper.writeValueAsString(body), headers), String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        return root.path("candidates").get(0)
                .path("content").path("parts").get(0)
                .path("text").asText();
    }

    // ── Groq API (OpenAI-compatible) ─────────────────────────────────────────

    private String callGroq(String systemPrompt, List<AiChatRequest.ChatMessage> messages) throws Exception {
        if (groqApiKey.isBlank()) throw new IllegalStateException("Groq API key not configured");

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", groqModel);
        body.put("max_tokens", 512);
        body.put("temperature", 0.8);

        ArrayNode msgs = body.putArray("messages");

        // system message
        msgs.addObject().put("role", "system").put("content", systemPrompt);

        // conversation history
        for (AiChatRequest.ChatMessage msg : messages) {
            msgs.addObject().put("role", msg.getRole()).put("content", msg.getContent());
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.groq.com/openai/v1/chat/completions",
                new HttpEntity<>(objectMapper.writeValueAsString(body), headers),
                String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        return root.path("choices").get(0)
                .path("message").path("content").asText();
    }

    // ── Parse reply + extract product ────────────────────────────────────────

    private AiChatResponse parseReply(String rawText) {
        Matcher matcher = PRODUCT_PATTERN.matcher(rawText);
        Product product = null;

        if (matcher.find()) {
            String keyword = matcher.group(1).trim();
            String cleanText = rawText.substring(0, matcher.start()).trim();

            List<Product> found = productRepository.findByNameContainingIgnoreCase(keyword);
            if (found.isEmpty() && keyword.contains(" ")) {
                // Try first word of keyword
                found = productRepository.findByNameContainingIgnoreCase(keyword.split(" ")[0]);
            }
            if (!found.isEmpty()) {
                product = found.get(0);
            }

            return AiChatResponse.builder()
                    .reply(cleanText)
                    .product(product)
                    .build();
        }

        return AiChatResponse.builder().reply(rawText).build();
    }
}
