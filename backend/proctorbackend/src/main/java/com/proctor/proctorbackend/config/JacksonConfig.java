package com.proctor.proctorbackend.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * API date-time contract: all {@link LocalDateTime} values are UTC (the DB and every
 * {@code now()} call use UTC) and are written with an explicit {@code Z}.
 *
 * <p>Without the {@code Z}, browsers parse {@code "2026-10-05T04:30:00"} as <em>local</em>
 * time, which shifted timers and exam windows by the client's UTC offset (5h30m in IST).
 * Incoming values with an offset are converted to UTC; values without one are taken as UTC.
 */
@Configuration
public class JacksonConfig {

    private static final DateTimeFormatter UTC_OUT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'");

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer utcDateTimeCustomizer() {
        return builder -> builder
                .serializerByType(LocalDateTime.class, new UtcSerializer())
                .deserializerByType(LocalDateTime.class, new UtcDeserializer());
    }

    static class UtcSerializer extends JsonSerializer<LocalDateTime> {
        @Override
        public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider serializers)
                throws IOException {
            gen.writeString(value.format(UTC_OUT));
        }
    }

    static class UtcDeserializer extends JsonDeserializer<LocalDateTime> {
        @Override
        public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            String text = p.getValueAsString();
            if (text == null || text.isBlank()) return null;
            text = text.trim();
            try {
                return OffsetDateTime.parse(text)
                        .withOffsetSameInstant(ZoneOffset.UTC)
                        .toLocalDateTime();
            } catch (DateTimeParseException noOffset) {
                try {
                    return LocalDateTime.parse(text);
                } catch (DateTimeParseException ex) {
                    return (LocalDateTime) ctxt.handleWeirdStringValue(
                            LocalDateTime.class, text, "Expected ISO-8601 date-time");
                }
            }
        }
    }
}
