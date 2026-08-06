package com.proctor.proctorbackend.common;

import com.proctor.proctorbackend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Public health-check endpoint — no JWT required.
 * Hit GET /api/health to verify the server, DB, and cache are up.
 */
@Slf4j
@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbcTemplate;
    private final RedisConnectionFactory redisConnectionFactory;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> health() {
        Map<String, String> data = new LinkedHashMap<>();

        data.put("server",  "Server is running on Java ☕");
        data.put("db",      checkDatabase());
        data.put("cache",   checkRedis());
        data.put("time",    LocalDateTime.now().toString());

        return ResponseEntity.ok(ApiResponse.success("Health check passed", data));
    }

    private String checkDatabase() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return "DB is connected ✅";
        } catch (Exception e) {
            log.warn("Database health check failed: {}", e.getMessage());
            return "DB is NOT connected ❌";
        }
    }

    private String checkRedis() {
        try {
            var conn = redisConnectionFactory.getConnection();
            conn.ping();
            conn.close();
            return "Cache is connected ✅";
        } catch (Exception e) {
            log.warn("Redis health check failed: {}", e.getMessage());
            return "Cache is NOT connected ❌";
        }
    }
}
