package com.proctor.proctorbackend.question;

/**
 * Supported question types in the exam proctoring platform.
 *
 * <ul>
 *   <li>{@code MCQ}         — Multiple choice, single correct option (A/B/C/D)</li>
 *   <li>{@code CODING}      — Programming problem with expected output / test cases</li>
 *   <li>{@code DESCRIPTIVE} — Free-text answer (reasoning, verbal, aptitude subjective)</li>
 *   <li>{@code TRUE_FALSE}  — Binary choice: True or False</li>
 *   <li>{@code FILL_BLANK}  — Fill in the blank(s), exact or keyword match</li>
 * </ul>
 */
public enum QuestionType {
    MCQ,
    CODING,
    DESCRIPTIVE,
    TRUE_FALSE,
    FILL_BLANK
}
