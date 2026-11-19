package com.proctor.proctorbackend.bulkimport;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class BulkImportJobEventListener {

    private final BulkImportProcessor processor;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onJobSubmitted(BulkImportJobSubmittedEvent event) {
        processor.process(event.jobId(), event.fileBytes(), event.filename(), event.organizationId());
    }
}
