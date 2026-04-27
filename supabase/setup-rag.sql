-- Enable Postgres Vector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to chat_messages if it doesn't exist
-- We are using 768 dimensions for Google's text-embedding-004 model
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create an HNSW index for ultra-fast nearest neighbor search
CREATE INDEX IF NOT EXISTS chat_messages_embedding_idx ON chat_messages USING hnsw (embedding vector_cosine_ops);

-- Hybrid Search Function (Vector Similarity + Filtering)
CREATE OR REPLACE FUNCTION match_messages (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid,
  p_session_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    messages.id,
    messages.content,
    messages.created_at,
    1 - (messages.embedding <=> query_embedding) AS similarity
  FROM chat_messages messages
  WHERE messages.user_id = p_user_id
    AND messages.session_id != p_session_id
    AND messages.embedding IS NOT NULL
    AND 1 - (messages.embedding <=> query_embedding) > match_threshold
  ORDER BY messages.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
