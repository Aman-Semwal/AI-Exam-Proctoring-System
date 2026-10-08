package com.proctor.proctorbackend.config;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class RateLimitingFilterTest {

    private final RateLimitingFilter filter = new RateLimitingFilter();

    private MockHttpServletResponse post(String path, String ip, String body, MockFilterChain chain) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setRemoteAddr(ip);
        if (body != null) {
            request.setContentType("application/json");
            request.setContent(body.getBytes(StandardCharsets.UTF_8));
        }
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, chain);
        return response;
    }

    private int login(String email, String ip) throws Exception {
        return post("/api/auth/login", ip, "{\"email\":\"" + email + "\",\"password\":\"x\"}", new MockFilterChain())
                .getStatus();
    }

    @Test
    void wholeClassBehindOneIp_canAllLogIn() throws Exception {
        // A college NAT: 60 students, one public IP
        for (int i = 0; i < 60; i++) {
            assertEquals(200, login("student" + i + "@college.edu", "10.0.0.1"), "student " + i);
        }
    }

    @Test
    void oneAccount_limitedToTenAttempts_evenAcrossIps() throws Exception {
        for (int i = 0; i < 10; i++) {
            assertEquals(200, login("victim@college.edu", "10.0.0." + i));
        }
        assertEquals(429, login("victim@college.edu", "10.0.0.99"));
    }

    @Test
    void accountLimit_isCaseInsensitive() throws Exception {
        for (int i = 0; i < 10; i++) login("Victim@College.edu", "1.1.1.1");
        assertEquals(429, login("victim@college.edu", "1.1.1.1"));
    }

    @Test
    void oneIp_sprayingManyAccounts_isEventuallyBlocked() throws Exception {
        for (int i = 0; i < 300; i++) login("user" + i + "@x.com", "6.6.6.6");
        assertEquals(429, login("another@x.com", "6.6.6.6"));
    }

    @Test
    void loginBody_isStillReadableByTheController() throws Exception {
        String body = "{\"email\":\"a@b.com\",\"password\":\"secret\"}";
        MockFilterChain chain = new MockFilterChain();
        post("/api/auth/login", "1.2.3.4", body, chain);

        HttpServletRequest passedOn = (HttpServletRequest) chain.getRequest();
        assertEquals(body, new String(passedOn.getInputStream().readAllBytes(), StandardCharsets.UTF_8));
    }

    @Test
    void malformedBody_fallsBackToIpLimitOnly() throws Exception {
        assertEquals(200, post("/api/auth/login", "7.7.7.7", "not json", new MockFilterChain()).getStatus());
    }

    @Test
    void register_allowsFivePerWindow() throws Exception {
        for (int i = 0; i < 5; i++) {
            assertEquals(200, post("/api/auth/register", "4.4.4.4", null, new MockFilterChain()).getStatus());
        }
        assertEquals(429, post("/api/auth/register", "4.4.4.4", null, new MockFilterChain()).getStatus());
    }

    @Test
    void otherEndpoints_areNotLimited() throws Exception {
        for (int i = 0; i < 20; i++) {
            assertEquals(200, post("/api/exams", "5.5.5.5", null, new MockFilterChain()).getStatus());
        }
    }
}
