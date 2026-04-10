export interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  type: 'file' | 'url' | 'youtube' | 'lyrics'; // 'file' for uploaded files, 'url' for external links, 'youtube', 'lyrics'
  folder_id: string | null;
  is_published: boolean;
  created_at: string;
  voice_part: string | null;
  original_filename: string | null;
  sort_order: number | null;
  file_size: number | null;
  youtube_url?: string | null;
}

export interface ResourceFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_nominated_for_dashboard: boolean;
  event_id: string | null;
}

// Helper function to determine resource type for color coding
export const getResourcePillType = (resource: Resource): 'pdf' | 'audio' | 'link' | 'youtube' | 'lyrics' | 'default' => {
  if (resource.type === 'youtube') return 'youtube';
  if (resource.type === 'lyrics') return 'lyrics';
  if (resource.type === 'url') return 'link';
  
  if (resource.type === 'file' && resource.url) {
    const url = resource.url.toLowerCase();
    if (url.endsWith('.pdf')) return 'pdf';
    if (url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a')) return 'audio';
  }
  
  return 'default';
};