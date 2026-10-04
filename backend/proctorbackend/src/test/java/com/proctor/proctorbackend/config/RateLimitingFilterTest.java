package com.proctor.proctorbackend.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;

class RateLimitingFilterTest {

    private final RateLimitingFilter filter = new RateLimitingFilter();

    private int post(String path, String ip) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response.getStatus();
    }

    @Test
    void login_allowsTenPerWindow_thenReturns429() throws Exception {
        for (int i = 0; i < 10; i++) {
            assertEquals(200, post("/api/auth/login", "1.1.1.1"), "attempt " + (i + 1));
        }
        assertEquals(429, post("/api/auth/login", "1.1.1.1"));
    }

    @Test
    void login_limitIsPerClientIp() throws Exception {
        for (int i = 0; i < 10; i++) post("/api/auth/login", "2.2.2.2");
        assertEquals(200, post("/api/auth/login", "3.3.3.3"));
    }

    @Test
    void register_allowsFivePerWindow() throws Exception {
        for (int i = 0; i < 5; i++) {
            assertEquals(200, post("/api/auth/register", "4.4.4.4"));
        }
        assertEquals(429, post("/api/auth/register", "4.4.4.4"));
    }

    @Test
    void otherEndpoints_areNotLimited() throws Exception {
        for (int i = 0; i < 20; i++) {
            assertEquals(200, post("/api/exams", "5.5.5.5"));
        }
    }
}
