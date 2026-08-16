package com.proctor.proctorbackend.bulkimport;

import com.proctor.proctorbackend.mail.MailService;
import com.proctor.proctorbackend.organization.OrganizationRepository;
import com.proctor.proctorbackend.user.UserRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.ByteArrayOutputStream;
import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class BulkImportProcessorTest {

    private BulkImportProcessor processor() {
        return new BulkImportProcessor(null, null, null, null, null, null);
    }

    @Test
    void parseXlsxPreservesNormalizedHeadersAndRowValues() throws Exception {
        BulkImportProcessor p = processor();
        byte[] xlsx = createWorkbookBytes(false);

        Method parseXlsx = BulkImportProcessor.class.getDeclaredMethod("parseXlsx", byte[].class);
        parseXlsx.setAccessible(true);

        @SuppressWarnings("unchecked")
        List<Map<String, String>> rows = (List<Map<String, String>>) parseXlsx.invoke(p, xlsx);

        assertEquals(1, rows.size());
        Map<String, String> row = rows.get(0);
        assertEquals("Alice Smith", row.get("name"));
        assertEquals("alice@example.com", row.get("email"));
        assertEquals("student", row.get("role"));
    }

    @Test
    void parseXlsxReadsAppliedRoleColumn() throws Exception {
        BulkImportProcessor p = processor();
        byte[] xlsx = createWorkbookBytes(true);

        Method parseXlsx = BulkImportProcessor.class.getDeclaredMethod("parseXlsx", byte[].class);
        parseXlsx.setAccessible(true);

        @SuppressWarnings("unchecked")
        List<Map<String, String>> rows = (List<Map<String, String>>) parseXlsx.invoke(p, xlsx);

        assertEquals(1, rows.size());
        assertEquals("SDE1", rows.get(0).get("appliedrole"));
    }

    @Test
    void parseXlsxReturnsEmptyForEmptySheet() throws Exception {
        BulkImportProcessor p = processor();

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            wb.createSheet("Sheet1");
            wb.write(out);
            byte[] xlsx = out.toByteArray();

            Method parseXlsx = BulkImportProcessor.class.getDeclaredMethod("parseXlsx", byte[].class);
            parseXlsx.setAccessible(true);

            @SuppressWarnings("unchecked")
            List<Map<String, String>> rows = (List<Map<String, String>>) parseXlsx.invoke(p, xlsx);
            assertTrue(rows.isEmpty());
        }
    }

    private byte[] createWorkbookBytes(boolean includeAppliedRole) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Members");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Name");
            header.createCell(1).setCellValue("Email");
            header.createCell(2).setCellValue("Role");
            if (includeAppliedRole) header.createCell(3).setCellValue("AppliedRole");

            Row row = sheet.createRow(1);
            row.createCell(0).setCellValue("Alice Smith");
            row.createCell(1).setCellValue("alice@example.com");
            row.createCell(2).setCellValue("student");
            if (includeAppliedRole) row.createCell(3).setCellValue("SDE1");

            workbook.write(out);
            return out.toByteArray();
        }
    }
}
