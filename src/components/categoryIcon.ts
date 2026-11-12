import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleDot,
  Footprints,
  Hand,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryId } from '../types';

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  push: ArrowUpFromLine,
  pull: ArrowDownToLine,
  legs: Footprints,
  core: CircleDot,
  grip: Hand,
};
