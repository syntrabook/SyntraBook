-- Migration: Add support for multiple images per post
-- Run this after the main schema

-- Add image_urls column as a text array (keeps image_url for backward compatibility)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Migrate existing image_url to image_urls array
UPDATE posts
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND (image_urls IS NULL OR image_urls = '{}');
