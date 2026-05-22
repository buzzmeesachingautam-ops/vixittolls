
export interface Tool {
  id: string;
  icon: string;
  name: string;
  desc: string;
  cat: string;
  free: boolean;
  page?: string;
}

export type Category = 'all' | 'pdf' | 'image' | 'calculator' | 'text' | 'resume' | 'converter' | 'seo' | 'dev' | 'finance';
