package com.proctor.proctorbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Spring configuration for Redis integration.
 *
 * <p>Defines a {@link RedisTemplate} bean with:
 * <ul>
 *   <li>String serialization for keys — keeps keys human-readable in Redis CLI.</li>
 *   <li>JSON serialization for values via {@link GenericJackson2JsonRedisSerializer} —
 *       allows storing arbitrary Java objects as JSON.</li>
 * </ul>
 *
 * <p>Connection details (host, port, password) are supplied via environment variables
 * and auto-configured by Spring Boot's Redis autoconfiguration.
 */
@Configuration
public class RedisConfig {

    /**
     * Creates a configured {@link RedisTemplate} for {@code String} keys and
     * {@code Object} values serialized as JSON.
     *
     * <p>Uses {@link GenericJackson2JsonRedisSerializer} (Spring Data Redis 3.x)
     * which internally configures a Jackson {@code ObjectMapper} with type information
     * support for round-trip deserialization.
     *
     * @param connectionFactory the Redis connection factory provided by Spring Boot
     * @return the configured {@link RedisTemplate}
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Keys as plain strings
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // Values as JSON — GenericJackson2JsonRedisSerializer is the correct class
        // in Spring Data Redis 3.x (bundled with Spring Boot 3.x).
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }
}
