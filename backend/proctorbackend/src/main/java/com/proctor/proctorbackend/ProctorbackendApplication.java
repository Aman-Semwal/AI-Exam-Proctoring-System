package com.proctor.proctorbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;

/**
 * Entry point for the AI Exam Proctoring backend.
 *
 * <p>Enabled features:
 * <ul>
 *   <li>{@code @EnableJpaAuditing}  – automatically populates @CreatedDate /
 *       @LastModifiedDate fields on JPA entities.</li>
 *   <li>{@code @EnableAsync}        – allows @Async methods (e.g. sending
 *       WebSocket alerts without blocking the request thread).</li>
 *   <li>{@code @EnableScheduling}   – activates @Scheduled tasks (e.g. periodic
 *       session health-checks or stale-session cleanup).</li>
 * </ul>
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "PT5M")
public class ProctorbackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProctorbackendApplication.class, args);
	}

}
