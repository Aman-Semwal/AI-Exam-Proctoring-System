package com.proctor.proctorbackend.user;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = "organization")
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

    List<User> findByOrganizationIdAndRole(Long organizationId, com.proctor.proctorbackend.common.enums.Role role);

    @EntityGraph(attributePaths = "organization")
    Page<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String name, String email, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT u.email FROM User u WHERE u.email IN :emails")
    java.util.Set<String> findExistingEmails(@org.springframework.data.repository.query.Param("emails") java.util.Set<String> emails);
}
