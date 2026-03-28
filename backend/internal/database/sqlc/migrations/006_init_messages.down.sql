DROP INDEX IF EXISTS idx_message_actions_message_id;
DROP TABLE IF EXISTS message_actions;
DROP INDEX IF EXISTS idx_message_revisions_message_id;
DROP TABLE IF EXISTS message_revisions;
DROP INDEX IF EXISTS idx_messages_deleted_at;
DROP INDEX IF EXISTS idx_messages_author_id;
DROP INDEX IF EXISTS idx_messages_dialog_sequence;
DROP TABLE IF EXISTS messages;
