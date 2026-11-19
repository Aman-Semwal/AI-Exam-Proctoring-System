package com.proctor.proctorbackend.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Service responsible for all JWT operations: generation, validation, and claim extraction.
 *
 * <p>Tokens are signed with HMAC-SHA using a base64-encoded secret key configured via
 * {@code spring.security.jwt.secret}. Expiry is controlled by
 * {@code spring.security.jwt.expiration-ms} (default 86400000 ms = 24 hours).
 *
 * <p>Multi-tenant claims embedded in each token:
 * <ul>
 *   <li>{@code userId}  — numeric user ID (avoids DB lookup in services)</li>
 *   <li>{@code role}    — e.g. {@code EXAM_CREATOR} (for authorization decisions)</li>
 *   <li>{@code orgId}   — organization ID for tenant scoping (null for SUPER_ADMIN)</li>
 *   <li>{@code orgSlug} — human-readable org identifier for logs/audits (null for SUPER_ADMIN)</li>
 * </ul>
 */
@Service
public class JwtService {

    @Value("${spring.security.jwt.secret}")
    private String secretKey;

    @Value("${spring.security.jwt.expiration-ms}")
    private long expirationMs;

    // -----------------------------------------------------------------------
    // Standard claim extractors
    // -----------------------------------------------------------------------

    /**
     * Extracts the username (email) stored in the JWT {@code sub} claim.
     *
     * @param token the signed JWT string
     * @return the subject claim value (user email)
     */
    public String extractUsername(String token) {
        return extractClaim(token, claims -> claims.getSubject());
    }

    /**
     * Generic claim extractor. Parses all claims and applies the provided resolver function.
     *
     * @param <T>            the type of the claim value to return
     * @param token          the signed JWT string
     * @param claimsResolver a function that maps {@link Claims} to the desired value
     * @return the resolved claim value
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        if (claims == null) return null;
        return claimsResolver.apply(claims);
    }

    // -----------------------------------------------------------------------
    // Multi-tenant claim extractors
    // -----------------------------------------------------------------------

    /**
     * Extracts the numeric user ID from the {@code userId} claim.
     *
     * @param token the signed JWT string
     * @return the user's database ID
     */
    public Long extractUserId(String token) {
        return extractClaim(token, claims -> {
            Object v = claims.get("userId");
            return v != null ? Long.valueOf(v.toString()) : null;
        });
    }

    /**
     * Extracts the role string from the {@code role} claim.
     *
     * @param token the signed JWT string
     * @return the role name (e.g. {@code "EXAM_CREATOR"})
     */
    public String extractRole(String token) {
        return extractClaim(token, claims -> (String) claims.get("role"));
    }

    /**
     * Extracts the organization ID from the {@code orgId} claim.
     * Returns {@code null} for SUPER_ADMIN tokens (no org scope).
     *
     * @param token the signed JWT string
     * @return the organization's database ID, or {@code null}
     */
    public Long extractOrgId(String token) {
        return extractClaim(token, claims -> {
            Object v = claims.get("orgId");
            return v != null ? Long.valueOf(v.toString()) : null;
        });
    }

    /**
     * Extracts the organization slug from the {@code orgSlug} claim.
     * Returns {@code null} for SUPER_ADMIN tokens.
     *
     * @param token the signed JWT string
     * @return the URL-safe org slug (e.g. {@code "mit-eecs"}), or {@code null}
     */
    public String extractOrgSlug(String token) {
        return extractClaim(token, claims -> (String) claims.get("orgSlug"));
    }

    // -----------------------------------------------------------------------
    // Token generation
    // -----------------------------------------------------------------------

    /**
     * Generates a JWT with no extra claims for the given user.
     *
     * @param userDetails the authenticated user principal
     * @return a signed JWT string
     */
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    /**
     * Generates a JWT with additional custom claims for the given user.
     *
     * @param extraClaims additional key-value pairs to embed in the token payload
     * @param userDetails the authenticated user principal
     * @return a signed JWT string
     */
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------

    /**
     * Validates a JWT against the given user details.
     *
     * @param token       the signed JWT string
     * @param userDetails the user to validate against
     * @return {@code true} if the token belongs to the user and has not expired
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username != null && username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    /**
     * Returns the expiration {@link Date} of a given token.
     * Used by the logout flow to calculate the Redis TTL for token blacklisting.
     *
     * @param token the signed JWT string
     * @return the token's expiry timestamp
     */
    public Date getExpirationDate(String token) {
        return extractExpiration(token);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, claims -> claims.getExpiration());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
