-- ============================================================================
-- V4 — remember that an expiry warning has been sent
--
-- The sweep runs daily and warns about reports nearing their 90-day expiry.
-- Without a marker it would warn about the same item every day for a week,
-- which is how a notification system teaches people to ignore it.
-- ============================================================================

ALTER TABLE item
    ADD COLUMN expiry_warned_at timestamptz;

COMMENT ON COLUMN item.expiry_warned_at IS
    'When the reporter was warned this report is about to expire. Null means not yet warned.';

-- The sweep looks only at open, unwarned reports approaching expiry.
CREATE INDEX ix_item_expiry_warning ON item (expires_at)
    WHERE status = 'OPEN' AND expiry_warned_at IS NULL;
