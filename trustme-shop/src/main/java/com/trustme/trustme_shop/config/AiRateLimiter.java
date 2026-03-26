package com.trustme.trustme_shop.config;

import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple sliding-window rate limiter for AI chat endpoint.
 * Tracks request timestamps per key (IP or userId) in memory.
 */
@Component
public class AiRateLimiter {

    // Per-IP limits
    private static final int MAX_PER_MINUTE = 10;
    private static final int MAX_PER_HOUR   = 60;
    private static final long MINUTE_MS = 60_000L;
    private static final long HOUR_MS   = 3_600_000L;

    private final ConcurrentHashMap<String, Deque<Long>> windows = new ConcurrentHashMap<>();

    public enum LimitResult { OK, MINUTE_EXCEEDED, HOUR_EXCEEDED }

    public LimitResult check(String key) {
        long now = System.currentTimeMillis();

        Deque<Long> timestamps = windows.compute(key, (k, deque) -> {
            if (deque == null) deque = new ArrayDeque<>();
            // Evict entries older than 1 hour (longest window we track)
            while (!deque.isEmpty() && deque.peekFirst() < now - HOUR_MS) {
                deque.pollFirst();
            }
            deque.addLast(now);
            return deque;
        });

        long countInHour   = timestamps.stream().filter(t -> t >= now - HOUR_MS).count();
        long countInMinute = timestamps.stream().filter(t -> t >= now - MINUTE_MS).count();

        if (countInMinute > MAX_PER_MINUTE) return LimitResult.MINUTE_EXCEEDED;
        if (countInHour   > MAX_PER_HOUR)   return LimitResult.HOUR_EXCEEDED;
        return LimitResult.OK;
    }

    /** Periodically clean up keys that have been idle > 1 hour to avoid memory leak */
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 600_000)
    public void evictStale() {
        long cutoff = System.currentTimeMillis() - HOUR_MS;
        windows.entrySet().removeIf(e ->
                e.getValue().isEmpty() || e.getValue().peekLast() < cutoff);
    }
}
