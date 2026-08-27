-- ============================================================================
-- V2 — store the Cloudinary public id alongside each photo URL
--
-- The URL is enough to display an image but not to delete one: Cloudinary's
-- destroy API works on public_id. Without it, cancelling an item or removing a
-- photo would orphan the file in the account forever.
--
-- NOT NULL is safe here only because item_photo is empty. Were there existing
-- rows, this would need to be added nullable, backfilled, then tightened.
-- ============================================================================

ALTER TABLE item_photo
    ADD COLUMN public_id text NOT NULL;

COMMENT ON COLUMN item_photo.public_id IS
    'Cloudinary public_id, e.g. refound/items/<uuid>/<random>. Required to delete the asset.';
