package com.proctor.proctorbackend.common;

import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.response.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SpeedTestControllerTest {

    private final SpeedTestController controller = new SpeedTestController();

    @Test
    void download_returnsRequestedKilobytes_uncacheable() {
        ResponseEntity<byte[]> res = controller.download(256);

        assertEquals(256 * 1024, res.getBody().length);
        assertEquals("no-store", res.getHeaders().getCacheControl());
    }

    @Test
    void download_isClampedTo2MbAndAtLeast1Kb() {
        assertEquals(2048 * 1024, controller.download(999_999).getBody().length);
        assertEquals(1024, controller.download(0).getBody().length);
    }

    @Test
    void download_isNotCompressibleZeros() {
        byte[] body = controller.download(64).getBody();
        long zeros = 0;
        for (byte b : body) if (b == 0) zeros++;
        assertTrue(zeros < body.length / 10, "payload should be random, not zeros");
    }

    @Test
    void upload_reportsBytesReceived() {
        ResponseEntity<ApiResponse<Map<String, Integer>>> res = controller.upload(new byte[300 * 1024]);

        assertEquals(300 * 1024, res.getBody().getData().get("bytes"));
    }

    @Test
    void upload_over2Mb_isRejected() {
        assertThrows(BadRequestException.class, () -> controller.upload(new byte[2 * 1024 * 1024 + 1]));
    }
}
