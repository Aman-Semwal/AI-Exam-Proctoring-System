package com.proctor.proctorbackend.common;

import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.response.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.io.IOException;
import java.io.InputStream;
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

    private static MockHttpServletRequest uploadOf(int bytes) {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/speedtest/upload");
        req.setContent(new byte[bytes]);
        return req;
    }

    @Test
    void upload_reportsBytesReceived() throws IOException {
        ResponseEntity<ApiResponse<Map<String, Integer>>> res = controller.upload(uploadOf(300 * 1024));

        assertEquals(300 * 1024, res.getBody().getData().get("bytes"));
    }

    @Test
    void upload_over2Mb_isRejected() {
        assertThrows(BadRequestException.class, () -> controller.upload(uploadOf(2 * 1024 * 1024 + 1)));
    }

    @Test
    void upload_declaredOver2Mb_isRejectedWithoutReadingTheBody() {
        // The mock ignores a Content-Length header, so report it the way a real container does
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/speedtest/upload") {
            @Override
            public long getContentLengthLong() {
                return 500L * 1024 * 1024;
            }

            @Override
            public jakarta.servlet.ServletInputStream getInputStream() {
                throw new AssertionError("body must not be read when Content-Length is over the cap");
            }
        };

        assertThrows(BadRequestException.class, () -> controller.upload(req));
    }

    @Test
    void upload_chunkedOverCap_stopsReadingAtTheCap() {
        // No Content-Length (chunked): an endless stream must be cut off, not buffered
        long[] read = {0};
        InputStream endless = new InputStream() {
            @Override public int read() { read[0]++; return 1; }
            @Override public int read(byte[] b, int off, int len) { read[0] += len; return len; }
        };
        MockHttpServletRequest wrapped = new MockHttpServletRequest("POST", "/api/speedtest/upload") {
            @Override
            public jakarta.servlet.ServletInputStream getInputStream() {
                return new org.springframework.mock.web.DelegatingServletInputStream(endless);
            }
        };

        assertThrows(BadRequestException.class, () -> controller.upload(wrapped));
        assertTrue(read[0] <= 2L * 1024 * 1024 + 64 * 1024, "read " + read[0] + " bytes");
    }
}
