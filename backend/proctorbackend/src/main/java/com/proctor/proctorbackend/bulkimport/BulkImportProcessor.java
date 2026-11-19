package com.proctor.proctorbackend.bulkimport;

import com.opencsv.CSVReader;
import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.mail.MailService;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.organization.OrganizationRepository;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.InputStreamReader;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Separate bean so @Async is applied via Spring proxy (not self-invocation).
 * Called by BulkImportServiceImpl.submitJob after saving the PENDING job.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BulkImportProcessor {

    private final BulkImportJobRepository jobRepository;
    private final BulkImportErrorRepository errorRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Async
    public void process(Long jobId, byte[] fileBytes, String filename, Long organizationId) {
        BulkImportJob job = jobRepository.findById(jobId).orElseThrow();
        Organization org = organizationRepository.getReferenceById(organizationId);
        job.setStatus(BulkImportStatus.PROCESSING);
        jobRepository.save(job);

        List<Map<String, String>> rows;
        try {
            rows = filename.endsWith(".csv") ? parseCsv(fileBytes) : parseXlsx(fileBytes);
        } catch (Exception e) {
            log.error("File parse error for job {}: {}", jobId, e.getMessage());
            job.setStatus(BulkImportStatus.FAILED);
            job.setCompletedAt(LocalDateTime.now(java.time.ZoneOffset.UTC));
            jobRepository.save(job);
            return;
        }

        job.setTotalRows(rows.size());
        int success = 0, failed = 0;
        List<BulkImportError> errors = new ArrayList<>();
        List<User> usersToSave = new ArrayList<>();
        List<String[]> welcomeMails = new ArrayList<>(); // [email, name, password, orgName, role]

        // 1. Batch Email Lookup & Local Duplicate Detection
        Set<String> allEmailsInFile = new HashSet<>();
        for (Map<String, String> row : rows) {
            String email = getMappedValue(row, "email");
            if (!isBlank(email)) allEmailsInFile.add(email.trim().toLowerCase());
        }
        
        Set<String> existingEmails = allEmailsInFile.isEmpty() ? new HashSet<>() 
                : userRepository.findExistingEmails(allEmailsInFile);
        Set<String> seenInFile = new HashSet<>();

        // 2. Process Rows
        for (int i = 0; i < rows.size(); i++) {
            int rowNum = i + 2;
            Map<String, String> row = rows.get(i);
            
            String email = getMappedValue(row, "email");
            String name  = getMappedValue(row, "name");

            if (isBlank(name)) {
                errors.add(error(job, rowNum, email, "Missing required field: name"));
                failed++; continue;
            }
            if (isBlank(email)) {
                errors.add(error(job, rowNum, null, "Missing required field: email"));
                failed++; continue;
            }
            
            email = email.trim().toLowerCase();
            
            if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
                errors.add(error(job, rowNum, email, "Invalid email format"));
                failed++; continue;
            }
            
            if (existingEmails.contains(email)) {
                errors.add(error(job, rowNum, email, "Email already registered"));
                failed++; continue;
            }
            
            if (seenInFile.contains(email)) {
                errors.add(error(job, rowNum, email, "Duplicate email in the uploaded file"));
                failed++; continue;
            }
            
            seenInFile.add(email);

            try {
                Role role = parseRole(getMappedValue(row, "role"));
                String plainPassword = generatePassword();

                User user = User.builder()
                        .name(name.trim())
                        .email(email)
                        .password(passwordEncoder.encode(plainPassword))
                        .role(role)
                        .organization(org)
                        .rollNo(getMappedValue(row, "rollno"))
                        .semester(getMappedValue(row, "semester"))
                        .batch(getMappedValue(row, "batch"))
                        .course(getMappedValue(row, "course"))
                        .stream(getMappedValue(row, "stream"))
                        .appliedRole(getMappedValue(row, "appliedrole"))
                        .build();

                usersToSave.add(user);
                welcomeMails.add(new String[]{email, name.trim(), plainPassword, org.getName(), role.name()});
                success++;
            } catch (Exception e) {
                log.error("Row {} failed: {}", rowNum, e.getMessage());
                errors.add(error(job, rowNum, email, e.getMessage()));
                failed++;
            }
        }

        if (!usersToSave.isEmpty()) userRepository.saveAll(usersToSave);
        if (!errors.isEmpty()) errorRepository.saveAll(errors);

        job.setSuccessCount(success);
        job.setFailedCount(failed);
        job.setStatus(BulkImportStatus.COMPLETED);
        job.setCompletedAt(LocalDateTime.now(java.time.ZoneOffset.UTC));
        jobRepository.save(job);
        log.info("Bulk import job {} completed: {} success, {} failed", jobId, success, failed);
        
        // 3. Async Email Dispatch
        if (!welcomeMails.isEmpty()) {
            new Thread(() -> {
                for (String[] m : welcomeMails) {
                    try {
                        mailService.sendWelcome(m[0], m[1], m[2], m[3], m[4]);
                    } catch (Exception mailEx) {
                        log.warn("Welcome mail could not be delivered for {}: {}", m[0], mailEx.getClass().getSimpleName());
                    }
                }
            }).start();
        }
    }

    private List<Map<String, String>> parseCsv(byte[] bytes) throws Exception {
        try (CSVReader reader = new CSVReader(new InputStreamReader(new java.io.ByteArrayInputStream(bytes)))) {
            List<String[]> all = reader.readAll();
            if (all.isEmpty()) return List.of();
            String[] headers = normalize(all.get(0));
            List<Map<String, String>> rows = new ArrayList<>();
            for (int i = 1; i < all.size(); i++) rows.add(zip(headers, all.get(i)));
            return rows;
        }
    }

    private List<Map<String, String>> parseXlsx(byte[] bytes) throws Exception {
        try (Workbook wb = new XSSFWorkbook(new java.io.ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheetAt(0);
            Iterator<Row> it = sheet.iterator();
            if (!it.hasNext()) return List.of();
            Row headerRow = it.next();
            String[] headers = new String[headerRow.getLastCellNum()];
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.getCell(i);
                headers[i] = c != null ? c.getStringCellValue().trim().toLowerCase().replace(" ", "") : "";
            }
            List<Map<String, String>> rows = new ArrayList<>();
            while (it.hasNext()) {
                Row row = it.next();
                Map<String, String> map = new HashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    map.put(headers[i], cellValue(cell));
                }
                rows.add(map);
            }
            return rows;
        }
    }

    private String[] normalize(String[] raw) {
        String[] h = new String[raw.length];
        for (int i = 0; i < raw.length; i++) h[i] = raw[i].trim().toLowerCase().replace(" ", "");
        return h;
    }

    private Map<String, String> zip(String[] headers, String[] values) {
        Map<String, String> map = new HashMap<>();
        for (int i = 0; i < headers.length; i++) map.put(headers[i], i < values.length ? values[i].trim() : "");
        return map;
    }

    private String cellValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default      -> "";
        };
    }

    private Role parseRole(String raw) {
        if (raw == null || raw.isBlank()) return Role.STUDENT;
        String normalized = raw.trim().toUpperCase();
        if (!normalized.equals("STUDENT") && !normalized.equals("EXAM_CREATOR") && !normalized.equals("PROCTOR")) {
            throw new IllegalArgumentException("Unsupported role: " + raw.trim());
        }
        return Role.valueOf(normalized);
    }

    private String generatePassword() {
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        return sb.toString();
    }

    private boolean isBlank(String s) { return s == null || s.isBlank(); }

    private BulkImportError error(BulkImportJob job, int row, String email, String reason) {
        return BulkImportError.builder().job(job).rowNumber(row).email(email).reason(reason).build();
    }

    // Flexible Alias Mapping Dictionary
    private static final Map<String, List<String>> ALIASES = Map.of(
        "email", List.of("email", "emailid", "emailaddress", "mail", "emaild"),
        "name", List.of("name", "studentname", "fullname", "firstname", "candidate"),
        "rollno", List.of("rollno", "rollnumber", "registrationno", "id", "studentid")
    );

    private String getMappedValue(Map<String, String> row, String standardKey) {
        // 1. Direct match first
        if (row.containsKey(standardKey)) {
            return row.get(standardKey);
        }
        
        // 2. Check aliases
        List<String> aliases = ALIASES.getOrDefault(standardKey, List.of());
        for (String alias : aliases) {
            if (row.containsKey(alias)) {
                return row.get(alias);
            }
            // 3. Fallback: Check if any row key *contains* the alias (more aggressive matching)
            for (String key : row.keySet()) {
                if (key.contains(alias) || alias.contains(key)) {
                    return row.get(key);
                }
            }
        }
        
        return row.get(standardKey); // Returns null if not found
    }
}
