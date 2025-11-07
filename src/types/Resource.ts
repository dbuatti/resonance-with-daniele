export interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  type: 'file' | 'url' | 'youtube' | 'lyrics'; // 'file' for uploaded files, 'url' for external links, 'youtube', 'lyrics'
  folder_id: string | null; // Added folder_id
  is_published: boolean;
  created_at: string;
  voice_part: string | null; // New: Voice part (e.g., 'Soprano 1', 'Alto')
  original_filename: string | null; // New: Original filename before server renaming
  sort_order: number | null; // New: Custom sort order for drag-and-drop
}

export interface ResourceFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}