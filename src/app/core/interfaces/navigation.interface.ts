export interface NavigationI {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  icon: string;
  link?: string;
  children?: NavigationI[];
}
