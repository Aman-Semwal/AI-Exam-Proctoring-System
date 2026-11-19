package com.proctor.proctorbackend.config;

import com.proctor.proctorbackend.user.InvitationStatus;
import com.proctor.proctorbackend.user.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Migrations V17–V21 seed demo accounts with a known password. They can't be edited
 * (already applied), so on a shared deployment set {@code SEED_ACCOUNTS_ENABLED=false}
 * and this runner deactivates them at startup.
 *
 * <p>The seeded super admin is deliberately left alone — disabling it could lock
 * everyone out. Change its password instead (see README).
 */
@Slf4j
@Component
public class SeedAccountGuard implements ApplicationRunner {

    static final List<String> SEEDED_DEMO_EMAILS = List.of(
            "admin@tech.edu", "examiner@tech.edu", "proctor@tech.edu", "student@tech.edu",
            "subagent-admin@test.com", "subagent-examiner@test.com",
            "subagent-proctor@test.com", "subagent-student@test.com");

    private final UserRepository userRepository;
    private final boolean seedAccountsEnabled;

    public SeedAccountGuard(UserRepository userRepository,
                            @Value("${app.seed-accounts.enabled:true}") boolean seedAccountsEnabled) {
        this.userRepository = userRepository;
        this.seedAccountsEnabled = seedAccountsEnabled;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (seedAccountsEnabled) return;
        SEEDED_DEMO_EMAILS.forEach(email -> userRepository.findByEmail(email).ifPresent(user -> {
            if (user.getInvitationStatus() != InvitationStatus.EXPIRED) {
                user.setInvitationStatus(InvitationStatus.EXPIRED);
                userRepository.save(user);
                log.warn("Seeded demo account {} deactivated (SEED_ACCOUNTS_ENABLED=false)", email);
            }
        }));
    }
}
