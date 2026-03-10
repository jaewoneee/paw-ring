import {
  Calendar,
  Bell,
  Check,
  Clock,
  Droplets,
  Hospital,
  PawPrint,
  Pill,
  RefreshCw,
  Tag,
  UtensilsCrossed,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

/**
 * FontAwesome icon name (stored in DB) -> Lucide component mapping.
 * Used for dynamic category icon rendering.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  paw: PawPrint,
  cutlery: UtensilsCrossed,
  'hospital-o': Hospital,
  tint: Droplets,
  tag: Tag,
  medkit: Pill,
  calendar: Calendar,
  'clock-o': Clock,
  refresh: RefreshCw,
  'bell-o': Bell,
  check: Check,
};

const FALLBACK_ICON: LucideIcon = Tag;

/**
 * Returns a Lucide icon component for the given FontAwesome icon name string.
 * Falls back to Tag if no mapping exists.
 */
export function getCategoryIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? FALLBACK_ICON;
}

export function CategoryIcon({
  name,
  size,
  color,
}: {
  name: string;
  size: number;
  color: string;
}) {
  const Icon = getCategoryIcon(name);
  return <Icon size={size} color={color} />;
}
