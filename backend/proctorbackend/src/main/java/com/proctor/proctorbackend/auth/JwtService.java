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
 */
@Service
public class JwtService {

    @Value("${spring.security.jwt.secret}")
    private String secretKey;

    @Value("${spring.security.jwt.expiration-ms}")
    private long expirationMs;

    /**
     * Extracts the username (email) stored in the JWT {@code sub} claim.
     *
     * @param token the signed JWT string
     * @return the subject claim value (user email)
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
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
        return claimsResolver.apply(claims);
    }

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

    /**
     * Validates a JWT against the given user details.
     *
     * @param token       the signed JWT string
     * @param userDetails the user to validate against
     * @return {@code true} if the token belongs to the user and has not expired
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    /**
     * Checks whether the token's expiration date is in the past.
     *
     * @param token the signed JWT string
     * @return {@code true} if expired
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Extracts the expiration date from the token.
     *
     * @param token the signed JWT string
     * @return the expiration {@link Date}
     */
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Parses and verifies the JWT signature, returning all claims.
     *
     * @param token the signed JWT string
     * @return the full {@link Claims} payload
     * @throws io.jsonwebtoken.JwtException if the token is malformed or the signature is invalid
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Decodes the base64 secret and builds the HMAC-SHA signing key.
     *
     * @return the {@link SecretKey} used for signing and verification
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
