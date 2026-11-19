package com.proctor.proctorbackend.proctoring;

import com.proctor.proctorbackend.proctoring.dto.FrameUploadRequest;
import com.proctor.proctorbackend.proctoring.dto.ReferencePhotoRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Oversized base64 images must be rejected (HTTP 400) before reaching the AI service. */
class UploadSizeLimitTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
    private static final String TOO_BIG = "a".repeat(2_000_001);

    @Test
    void frame_overLimit_rejected() {
        FrameUploadRequest req = new FrameUploadRequest();
        req.setSessionId(1L);
        req.setFrameBase64(TOO_BIG);
        assertFalse(validator.validate(req).isEmpty());
    }

    @Test
    void frame_normalSize_accepted() {
        FrameUploadRequest req = new FrameUploadRequest();
        req.setSessionId(1L);
        req.setFrameBase64("a".repeat(60_000));
        assertTrue(validator.validate(req).isEmpty());
    }

    @Test
    void referencePhoto_overLimit_rejected() {
        ReferencePhotoRequest req = new ReferencePhotoRequest();
        req.setImageBase64(TOO_BIG);
        assertFalse(validator.validate(req).isEmpty());
    }
}
