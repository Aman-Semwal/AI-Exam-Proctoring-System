package com.proctor.proctorbackend.mail;

public interface MailService {
    void sendWelcome(String toEmail, String name, String plainPassword, String orgName, String role);

    void sendInvitationLink(String toEmail, String name, String activationLink, String orgName, String role);
}
