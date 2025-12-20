/**
 * TomeSphere Design System
 * Ported from Flutter App (Slate/Violet Theme)
 */

export const Palette = {
  // Backgrounds
  bgCanvas: '#0F172A', // Slate 950
  surface1: '#1E293B', // Slate 800
  surface2: '#334155', // Slate 700
  glass: 'rgba(30, 41, 59, 0.7)',

  // Accents
  primary: '#8B5CF6',   // Violet 500
  secondary: '#10B981', // Emerald 500
  coral: '#E94560',
  blue: '#3B82F6',
  orange: '#F59E0B',

  // Text
  textHigh: '#FFFFFF',
  textMed: '#94A3B8',  // Slate 400
  textLow: '#64748B',  // Slate 500

  // Gradients (Start/End tuples for LinearGradient)
  gradients: {
    primary: ['#8B5CF6', '#6366F1'],
    coral: ['#E94560', '#FF6B6B'],
    emerald: ['#10B981', '#059669'],
    blue: ['#3B82F6', '#2563EB'],
  }
};

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: Palette.primary,
    tabIconDefault: '#ccc',
    tabIconSelected: Palette.primary,
  },
  dark: {
    text: Palette.textHigh,
    background: Palette.bgCanvas,
    tint: Palette.primary,
    tabIconDefault: Palette.textLow,
    tabIconSelected: Palette.primary,
    // Custom properties for our theme
    surface: Palette.surface1,
    surfaceHighlight: Palette.surface2,
    secondary: Palette.textMed,
  },
};
