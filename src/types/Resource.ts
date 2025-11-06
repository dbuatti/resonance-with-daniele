export interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  type: 'file' | 'url'; // 'file' for uploaded files, 'url' for external links
  folder_path: string | null;
  is_published: boolean;
  created_at: string;
}