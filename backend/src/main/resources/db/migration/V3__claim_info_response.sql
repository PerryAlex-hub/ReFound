-- ============================================================================
-- V3 — record the claimant's answer when an admin asks for more information
--
-- V1 gave the claim an info_request column but nowhere to put the reply.
-- Overwriting `description` would destroy the original account of the item,
-- which is the very evidence the review compares against the finder's answer.
-- ============================================================================

ALTER TABLE claim
    ADD COLUMN info_response text;

COMMENT ON COLUMN claim.info_request IS
    'Question an admin asked the claimant while the claim sat in AWAITING_INFO.';

COMMENT ON COLUMN claim.info_response IS
    'The claimant''s answer. Kept separate from description so the original
     statement of ownership survives intact for the reviewer.';
