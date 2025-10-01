/// Spacing constants matching the web app's design system
class AppSpacing {
  AppSpacing._();

  // Base spacing unit (rem in web = 4px in Flutter)
  static const double unit = 4.0;

  // Common spacing values
  static const double xxs = 2.0;   // 0.125rem
  static const double xs = 4.0;    // 0.25rem
  static const double sm = 8.0;    // 0.5rem
  static const double md = 12.0;   // 0.75rem
  static const double lg = 16.0;   // 1rem
  static const double xl = 20.0;   // 1.25rem
  static const double xl2 = 24.0;  // 1.5rem
  static const double xl3 = 28.0;  // 1.75rem
  static const double xl4 = 32.0;  // 2rem
  static const double xl5 = 40.0;  // 2.5rem
  static const double xl6 = 48.0;  // 3rem

  // Padding presets
  static const double paddingXS = 4.0;
  static const double paddingSM = 8.0;
  static const double paddingMD = 12.0;
  static const double paddingLG = 16.0;
  static const double paddingXL = 24.0;
  static const double paddingXXL = 32.0;

  // Margin presets
  static const double marginXS = 4.0;
  static const double marginSM = 8.0;
  static const double marginMD = 12.0;
  static const double marginLG = 16.0;
  static const double marginXL = 24.0;
  static const double marginXXL = 32.0;

  // Border radius (--radius: 0.5rem = 8px)
  static const double radiusSM = 4.0;   // calc(var(--radius) - 4px)
  static const double radiusMD = 6.0;   // calc(var(--radius) - 2px)
  static const double radiusLG = 8.0;   // var(--radius)
  static const double radiusXL = 12.0;
  static const double radiusFull = 9999.0;

  // Icon sizes
  static const double iconXS = 12.0;
  static const double iconSM = 16.0;
  static const double iconMD = 20.0;
  static const double iconLG = 24.0;
  static const double iconXL = 32.0;

  // Button heights
  static const double buttonSM = 32.0;
  static const double buttonMD = 40.0;
  static const double buttonLG = 48.0;

  // Input heights
  static const double inputSM = 32.0;
  static const double inputMD = 40.0;
  static const double inputLG = 48.0;

  // Avatar sizes
  static const double avatarSM = 24.0;
  static const double avatarMD = 32.0;
  static const double avatarLG = 40.0;
  static const double avatarXL = 48.0;

  // Container max widths
  static const double containerSM = 640.0;
  static const double containerMD = 768.0;
  static const double containerLG = 1024.0;
  static const double containerXL = 1280.0;

  // Task list specific
  static const double taskItemPadding = 12.0;
  static const double taskItemSpacing = 8.0;
  static const double taskGroupSpacing = 24.0;
  static const double checkboxSize = 20.0;
  static const double progressIndicatorSize = 16.0;
}