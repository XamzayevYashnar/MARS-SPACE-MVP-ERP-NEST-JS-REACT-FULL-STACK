-- The admin lead list filters by assignee ("my leads"); without this index
-- that filter is a sequential scan over the whole table.
CREATE INDEX "leads_assignedToId_idx" ON "leads"("assignedToId");

-- The nightly refresh-token reaper deletes by expiry.
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");
