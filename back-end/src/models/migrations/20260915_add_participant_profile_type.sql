ALTER TABLE participants
  ADD COLUMN profile_type ENUM('account', 'alias', 'password') NULL AFTER role;

UPDATE participants
SET profile_type = CASE
  WHEN user_id IS NOT NULL THEN 'account'
  ELSE 'password'
END;

ALTER TABLE participants
  MODIFY COLUMN profile_type ENUM('account', 'alias', 'password') NOT NULL DEFAULT 'password';
