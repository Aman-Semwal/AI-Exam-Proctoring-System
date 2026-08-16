package com.proctor.proctorbackend.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class JwtBlacklistService {

    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";

    private final RedisTemplate<String, String> redisTemplate;

    public boolean isBlacklisted(String token) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
        } catch (RuntimeException ex) {
            log.warn("JWT blacklist lookup failed: {}", ex.getClass().getSimpleName());
            return false;
        }
    }

    public void blacklist(String token, Duration ttl) {
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            return;
        }
        redisTemplate.opsForValue().set(BLACKLIST_PREFIX + token, "1", ttl);
    }
}
