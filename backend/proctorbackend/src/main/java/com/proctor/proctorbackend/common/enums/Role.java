package com.proctor.proctorbackend.common.enums;

/**
 * System-wide roles for the multi-tenant exam proctoring platform.
 *
 * <p>Stored as a VARCHAR string in the database (JPA {@code EnumType.STRING}).
 * V4 Flyway migration remaps legacy EXAMINER → EXAM_CREATOR and ADMIN → ORG_ADMIN.
 *
 * <ul>
 *   <li>{@code SUPER_ADMIN}  — platform owner; manages orgs, billing, AI model versions.</li>
 *   <li>{@code ORG_ADMIN}    — per-org admin; invites users, manages org settings.</li>
 *   <li>{@code EXAM_CREATOR} — creates question banks and exams (replaces EXAMINER).</li>
 *   <li>{@code PROCTOR}      — monitors live sessions and acts on AI violation alerts.</li>
 *   <li>{@code STUDENT}      — takes exams; unchanged from legacy model.</li>
 * </ul>
 */
public enum Role {
    SUPER_ADMIN,
    ORG_ADMIN,
    EXAM_CREATOR,
    PROCTOR,
    STUDENT
}
