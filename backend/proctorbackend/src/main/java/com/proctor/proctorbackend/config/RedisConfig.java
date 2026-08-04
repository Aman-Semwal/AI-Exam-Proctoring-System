package com.proctor.proctorbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Spring configuration for Redis integration.
 *
 * <p>Defines a {@link RedisTemplate} bean with:
 * <ul>
 *   <li>String serialization for keys — keeps keys human-readable in Redis CLI.</li>
 *   <li>JSON serialization for values via {@link GenericJacksonJsonRedisSerializer} —
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
     * <p>Uses {@link GenericJacksonJsonRedisSerializer#builder()} (Spring Data Redis 4.x)
     * which internally configures a Jackson 3 {@code JsonMapper} with type information
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

        // Values as JSON — use builder() to get a properly configured Jackson 3 ObjectMapper.
        // GenericJacksonJsonRedisSerializer is the Spring Data Redis 4.x replacement for
        // the removed GenericJackson2JsonRedisSerializer.
        GenericJacksonJsonRedisSerializer jsonSerializer =
                GenericJacksonJsonRedisSerializer.builder().build();
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }
}
