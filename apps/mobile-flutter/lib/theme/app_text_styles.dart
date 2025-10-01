import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Typography system matching the web app
class AppTextStyles {
  AppTextStyles._();

  // Base font family (Arial from web app's globals.css)
  static const String fontFamily = 'Arial';

  // Heading 1 - text-3xl font-bold tracking-tight (30px, bold, -0.5 letter-spacing)
  static const TextStyle h1 = TextStyle(
    fontFamily: fontFamily,
    fontSize: 30,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
    height: 1.2,
    color: AppColors.foreground,
  );

  // Heading 2 - text-2xl font-bold
  static const TextStyle h2 = TextStyle(
    fontFamily: fontFamily,
    fontSize: 24,
    fontWeight: FontWeight.bold,
    height: 1.3,
    color: AppColors.foreground,
  );

  // Heading 3 - text-xl font-bold
  static const TextStyle h3 = TextStyle(
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: FontWeight.bold,
    height: 1.4,
    color: AppColors.foreground,
  );

  // Heading 4 - text-lg font-bold (used for task groups: "Today", "High Priority")
  static const TextStyle h4 = TextStyle(
    fontFamily: fontFamily,
    fontSize: 18,
    fontWeight: FontWeight.bold,
    height: 1.5,
    color: AppColors.foreground,
  );

  // Body Large - text-base (16px) - used for task titles
  static const TextStyle bodyLarge = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.normal,
    height: 1.5,
    color: AppColors.foreground,
  );

  // Body Medium - text-sm (14px)
  static const TextStyle bodyMedium = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.normal,
    height: 1.5,
    color: AppColors.foreground,
  );

  // Body Small - text-xs (12px) - used for task metadata
  static const TextStyle bodySmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.normal,
    height: 1.5,
    color: AppColors.mutedForeground,
  );

  // Label - for form labels
  static const TextStyle label = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    height: 1.5,
    color: AppColors.foreground,
  );

  // Button text
  static const TextStyle button = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    height: 1,
    letterSpacing: 0.5,
  );

  // Caption - very small text
  static const TextStyle caption = TextStyle(
    fontFamily: fontFamily,
    fontSize: 11,
    fontWeight: FontWeight.normal,
    height: 1.3,
    color: AppColors.mutedForeground,
  );

  // Overline - uppercase small text
  static const TextStyle overline = TextStyle(
    fontFamily: fontFamily,
    fontSize: 10,
    fontWeight: FontWeight.w500,
    height: 1.6,
    letterSpacing: 1.5,
    color: AppColors.mutedForeground,
  );

  // Task title (completed) - with strikethrough
  static const TextStyle taskCompleted = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.normal,
    height: 1.5,
    decoration: TextDecoration.lineThrough,
    decorationColor: AppColors.mutedForeground,
    color: AppColors.mutedForeground,
  );

  // Task title (active) - bold
  static const TextStyle taskActive = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w500,
    height: 1.5,
    color: AppColors.foreground,
  );

  // Pomodoro timer display
  static const TextStyle timerDisplay = TextStyle(
    fontFamily: fontFamily,
    fontSize: 48,
    fontWeight: FontWeight.bold,
    height: 1,
    color: AppColors.foreground,
  );

  // Helper method to apply color to any style
  static TextStyle withColor(TextStyle style, Color color) {
    return style.copyWith(color: color);
  }
}