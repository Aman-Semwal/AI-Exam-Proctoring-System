package com.proctor.proctorbackend.coderunner;

import com.proctor.proctorbackend.coderunner.dto.CodeRunRequest;
import com.proctor.proctorbackend.coderunner.dto.CodeRunResponse;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

@RestController
@RequestMapping("/api/code")
@RequiredArgsConstructor
public class CodeRunnerController {

    private final Judge0Service judge0Service;

    /** Per-user buckets: 10 code runs per minute. */
        private final Cache<String, Bucket> buckets = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofMinutes(15))
            .maximumSize(10_000)
            .build();

    @PostMapping("/run")
    public ResponseEntity<CodeRunResponse> run(
            @Valid @RequestBody CodeRunRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Bucket bucket = buckets.get(userDetails.getUsername(), k ->
                Bucket.builder()
                        .addLimit(Bandwidth.builder()
                                .capacity(10)
                                .refillGreedy(10, Duration.ofMinutes(1))
                                .build())
                        .build());

        if (!bucket.tryConsume(1)) {
            throw new BadRequestException("Rate limit exceeded: max 10 code runs per minute");
        }

        return ResponseEntity.ok(judge0Service.run(request));
    }
}
