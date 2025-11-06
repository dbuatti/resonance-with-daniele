export interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  type: 'file' | 'url'; // 'file' for uploaded files, 'url' for external links
  folder_id: string | null; // Added folder_id
  is_published: boolean;
  created_at: string;
}

export interface ResourceFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}