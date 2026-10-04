package com.proctor.proctorbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;

import java.util.TimeZone;

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
		// All LocalDateTime values are UTC (see JacksonConfig). Pin the JVM zone so
		// LocalDateTime.now() and bean validation (@Future) agree on any host, e.g. a dev
		// machine in IST — otherwise "now" is 5h30m ahead of the stored UTC times.
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		SpringApplication.run(ProctorbackendApplication.class, args);
	}

}
