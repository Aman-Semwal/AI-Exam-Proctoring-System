package com.proctor.proctorbackend.user;

import org.springframework.data.jpa.repository.EntityGraph;
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
}
