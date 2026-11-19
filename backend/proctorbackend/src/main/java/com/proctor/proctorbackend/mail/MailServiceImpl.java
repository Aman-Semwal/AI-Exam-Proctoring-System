package com.proctor.proctorbackend.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailServiceImpl implements MailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${mail.from}")
    private String from;

    @Value("${mail.enabled:false}")
    private boolean mailEnabled;

    @Override
    @Async
    public void sendWelcome(String toEmail, String name, String plainPassword, String orgName, String role) {
        if (!mailEnabled) {
            log.info("Mail disabled — skipping welcome email to {}", maskEmail(toEmail));
            return;
        }
        try {
            String template = selectWelcomeTemplate(role);

            Context ctx = new Context();
            ctx.setVariable("name", name);
            ctx.setVariable("email", toEmail);
            ctx.setVariable("password", plainPassword);
            ctx.setVariable("orgName", orgName);

            String html = templateEngine.process(template, ctx);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to " + orgName + " — Your Account Details");
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Welcome email sent to {}", maskEmail(toEmail));
        } catch (Exception e) {
            log.error("Failed to send welcome email to {} [MAIL_SEND_FAILED]", maskEmail(toEmail));
        }
    }

    @Override
    @Async
    public void sendInvitationLink(String toEmail, String name, String activationLink, String orgName, String role) {
        if (!mailEnabled) {
            log.info("Mail disabled — skipping invitation email to {}", maskEmail(toEmail));
            return;
        }
        try {
            Context ctx = new Context();
            ctx.setVariable("name", name);
            ctx.setVariable("email", toEmail);
            ctx.setVariable("activationLink", activationLink);
            ctx.setVariable("orgName", orgName);
            ctx.setVariable("role", role);

            String html = templateEngine.process("invitation-activation", ctx);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Complete your account setup for " + orgName);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Invitation email sent to {}", maskEmail(toEmail));
        } catch (Exception e) {
            log.error("Failed to send invitation email to {} [MAIL_SEND_FAILED]", maskEmail(toEmail));
        }
    }

    private String selectWelcomeTemplate(String role) {
        if (role == null) {
            return "student-welcome";
        }
        if (role.equalsIgnoreCase("EXAMINER") || role.equalsIgnoreCase("EXAM_CREATOR") || role.equalsIgnoreCase("PROCTOR")) {
            return "examiner-welcome";
        }
        if (role.equalsIgnoreCase("ORG_ADMIN")) {
            return "admin-welcome";
        }
        return "student-welcome";
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        int at = email.indexOf('@');
        String local = email.substring(0, at);
        String domain = email.substring(at);
        if (local.length() <= 2) {
            return "***" + domain;
        }
        return local.substring(0, 2) + "***" + domain;
    }
}
