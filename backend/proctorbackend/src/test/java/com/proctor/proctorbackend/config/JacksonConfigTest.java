package com.proctor.proctorbackend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The API contract: every LocalDateTime is UTC and travels with an explicit "Z",
 * so browsers in any timezone parse it correctly.
 */
class JacksonConfigTest {

    private ObjectMapper mapper;

    record Holder(LocalDateTime time) {}

    @BeforeEach
    void setUp() {
        Jackson2ObjectMapperBuilder builder = new Jackson2ObjectMapperBuilder();
        new JacksonConfig().utcDateTimeCustomizer().customize(builder);
        mapper = builder.build();
    }

    @Test
    @DisplayName("serializes LocalDateTime as UTC ISO string with Z suffix")
    void serialize_appendsZ() throws Exception {
        String json = mapper.writeValueAsString(new Holder(LocalDateTime.of(2026, 10, 5, 4, 30, 0)));
        assertEquals("{\"time\":\"2026-10-05T04:30:00Z\"}", json);
    }

    @Test
    @DisplayName("deserializes a Z-suffixed instant as UTC")
    void deserialize_zulu() throws Exception {
        Holder h = mapper.readValue("{\"time\":\"2026-10-05T04:30:00.000Z\"}", Holder.class);
        assertEquals(LocalDateTime.of(2026, 10, 5, 4, 30, 0), h.time());
    }

    @Test
    @DisplayName("deserializes an offset time by converting it to UTC")
    void deserialize_offsetConvertedToUtc() throws Exception {
        Holder h = mapper.readValue("{\"time\":\"2026-10-05T10:00:00+05:30\"}", Holder.class);
        assertEquals(LocalDateTime.of(2026, 10, 5, 4, 30, 0), h.time());
    }

    @Test
    @DisplayName("deserializes a time without offset as UTC (backward compatible)")
    void deserialize_noOffset_treatedAsUtc() throws Exception {
        Holder h = mapper.readValue("{\"time\":\"2026-10-05T04:30\"}", Holder.class);
        assertEquals(LocalDateTime.of(2026, 10, 5, 4, 30, 0), h.time());
    }
}
