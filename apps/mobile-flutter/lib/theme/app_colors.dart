import 'package:flutter/material.dart';

/// App color palette extracted from Tailwind CSS config
/// Source: apps/web/tailwind.config.ts and apps/web/app/globals.css
class AppColors {
  AppColors._();

  // Base colors from --background, --foreground, etc.
  static const Color background = Color(0xFFFFFFFF);
  static const Color foreground = Color(0xFF0A0A0A);

  // Card colors
  static const Color card = Color(0xFFFFFFFF);
  static const Color cardForeground = Color(0xFF0A0A0A);

  // Popover colors
  static const Color popover = Color(0xFFFFFFFF);
  static const Color popoverForeground = Color(0xFF0A0A0A);

  // Primary colors (--primary: 0 0% 9%)
  static const Color primary = Color(0xFF171717);
  static const Color primaryForeground = Color(0xFFFAFAFA);

  // Secondary colors (--secondary: 0 0% 96.1%)
  static const Color secondary = Color(0xFFF5F5F5);
  static const Color secondaryForeground = Color(0xFF171717);

  // Muted colors (--muted: 0 0% 96.1%)
  static const Color muted = Color(0xFFF5F5F5);
  static const Color mutedForeground = Color(0xFF737373);

  // Accent colors (--accent: 0 0% 96.1%)
  static const Color accent = Color(0xFFF5F5F5);
  static const Color accentForeground = Color(0xFF171717);

  // Destructive colors (--destructive: 0 84.2% 60.2%)
  static const Color destructive = Color(0xFFEF4444);
  static const Color destructiveForeground = Color(0xFFFAFAFA);

  // Border and input (--border: 0 0% 89.8%)
  static const Color border = Color(0xFFE5E5E5);
  static const Color input = Color(0xFFE5E5E5);

  // Ring color for focus states
  static const Color ring = Color(0xFF0A0A0A);

  // Chart colors
  static const Color chart1 = Color(0xFFE8764D);
  static const Color chart2 = Color(0xFF4D9B9B);
  static const Color chart3 = Color(0xFF335C67);
  static const Color chart4 = Color(0xFFF4D58D);
  static const Color chart5 = Color(0xFFF08A4B);

  // Sidebar colors
  static const Color sidebarBackground = Color(0xFFFAFAFA);
  static const Color sidebarForeground = Color(0xFF525252);
  static const Color sidebarPrimary = Color(0xFF171717);
  static const Color sidebarPrimaryForeground = Color(0xFFFAFAFA);
  static const Color sidebarAccent = Color(0xFFF5F5F5);
  static const Color sidebarAccentForeground = Color(0xFF171717);
  static const Color sidebarBorder = Color(0xFFE5E7EB);
  static const Color sidebarRing = Color(0xFF3B82F6);

  // Additional utility colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // Gray scale
  static const Color gray50 = Color(0xFFFAFAFA);
  static const Color gray100 = Color(0xFFF5F5F5);
  static const Color gray200 = Color(0xFFE5E5E5);
  static const Color gray300 = Color(0xFFD4D4D4);
  static const Color gray400 = Color(0xFFA3A3A3);
  static const Color gray500 = Color(0xFF737373);
  static const Color gray600 = Color(0xFF525252);
  static const Color gray700 = Color(0xFF404040);
  static const Color gray800 = Color(0xFF262626);
  static const Color gray900 = Color(0xFF171717);

  // Task priority colors (inferred from UI)
  static const Color highPriority = Color(0xFFEF4444);
  static const Color mediumPriority = Color(0xFFF59E0B);
  static const Color lowPriority = Color(0xFF10B981);

  // Transparent overlay
  static const Color overlay = Color(0x80000000);
}