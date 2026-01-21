-- Add columns for Dispatch System
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS dispatch_status TEXT DEFAULT 'pending';

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS assigned_team TEXT;

-- Create an index for faster filtering by dispatch status
CREATE INDEX IF NOT EXISTS idx_posts_dispatch_status ON posts(dispatch_status);
