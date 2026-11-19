package com.proctor.proctorbackend.common;

import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;
import java.util.Random;

/**
 * Bandwidth test for the pre-exam system check. During the exam each 5 s tick uploads a
 * webcam frame, a screenshot and an audio chunk (~300 KB), so the student's upload speed
 * matters. Requires a login (not in SecurityConfig's public list), so it can't be used as
 * an anonymous bandwidth sink; payloads are capped at 2 MB.
 */
@RestController
@RequestMapping("/api/speedtest")
public class SpeedTestController {

    static final int MAX_KB = 2048;
    private static final int MAX_BYTES = MAX_KB * 1024;

    /** Random bytes so gzip on a proxy can't shrink the payload and inflate the result. */
    private static final byte[] PAYLOAD = new byte[MAX_BYTES];
    static {
        new Random(42).nextBytes(PAYLOAD);
    }

    @GetMapping(value = "/download", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @Operation(summary = "Download `kb` kilobytes (1–2048) to measure download speed")
    public ResponseEntity<byte[]> download(@RequestParam(defaultValue = "512") int kb) {
        int size = Math.max(1, Math.min(MAX_KB, kb)) * 1024;
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(Arrays.copyOf(PAYLOAD, size));
    }

    @PostMapping(value = "/upload", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @Operation(summary = "Upload up to 2 MB to measure upload speed; the body is discarded")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> upload(@RequestBody byte[] body) {
        if (body.length > MAX_BYTES) {
            throw new BadRequestException("Speed test payload is limited to 2 MB");
        }
        return ResponseEntity.ok(ApiResponse.success("Upload received", Map.of("bytes", body.length)));
    }
}
