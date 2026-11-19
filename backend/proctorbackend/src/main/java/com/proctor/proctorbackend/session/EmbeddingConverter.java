package com.proctor.proctorbackend.session;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Stores a face embedding as a comma-separated TEXT column
 * ({@code exam_sessions.reference_embedding}).
 */
@Converter
public class EmbeddingConverter implements AttributeConverter<List<Double>, String> {

    @Override
    public String convertToDatabaseColumn(List<Double> embedding) {
        if (embedding == null || embedding.isEmpty()) return null;
        return embedding.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    @Override
    public List<Double> convertToEntityAttribute(String column) {
        if (column == null || column.isBlank()) return null;
        return Arrays.stream(column.split(",")).map(Double::valueOf).toList();
    }
}
