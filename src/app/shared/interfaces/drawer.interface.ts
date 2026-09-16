export interface DrawerI {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface TabI {
  id: number;
  icon: string;
  type: 'image' | 'icon';
  title: string;
  description: string;
}
