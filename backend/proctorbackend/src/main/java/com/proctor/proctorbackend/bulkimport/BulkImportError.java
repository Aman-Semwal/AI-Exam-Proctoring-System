package com.proctor.proctorbackend.bulkimport;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bulk_import_errors")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkImportError {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private BulkImportJob job;

    @Column(nullable = false)
    private int rowNumber;

    private String email;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;
}
