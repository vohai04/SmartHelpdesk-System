# Durable ticket triage

Creating a ticket saves the ticket and its AI, email, notification and realtime jobs in one PostgreSQL transaction. The response returns immediately with a null priority and `Pending` triage status. The UI displays “Classifying…”; a failed classification displays “Needs manual triage”. Existing priorities are preserved by the migration.

The worker moves triage through `Pending → Processing → Completed`. Invalid output, provider errors and timeouts retry up to three attempts, then become `Failed`. No fallback assigns Medium. AI results contain a named priority, sentiment and summary. A manually chosen priority always takes precedence; the ticket version provides optimistic concurrency protection.

Jobs are claimed atomically with PostgreSQL row locking and a lease. Default AI concurrency is two, timeout is 30 seconds and polling interval is 500 milliseconds. Email, notification and realtime lanes run independently. After an abrupt process termination, abandoned jobs can be reclaimed after their two-minute lease expires. Delivery is at least once: SMTP delivery can repeat if the process stops after sending but before recording completion.

`TicketTriageUpdated` carries the ticket ID, public status, priority, triage state, priority source and version. Only staff and the ticket owner receive it. Internal AI summaries are fetched separately through the authorized ticket endpoint. Frontend updates reject older versions and reconcile server state on reconnection. Triage updates do not reload the conversation.

Configuration keys under `TicketJobs` are `Enabled`, `AiConcurrency`, `TimeoutSeconds` and `PollIntervalMilliseconds`. The database must support PostgreSQL `FOR UPDATE SKIP LOCKED`. No external queue is required. Real provider latency depends on the provider and has not been benchmarked by the local tests.
