import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_text_styles.dart';

/// Button variants matching shadcn/ui Button component
enum AppButtonVariant {
  primary,    // default - black bg, white text
  secondary,  // gray bg
  destructive,// red bg
  outline,    // transparent with border
  ghost,      // transparent, no border
}

enum AppButtonSize {
  sm,
  md,
  lg,
}

class AppButton extends StatelessWidget {
  final String? text;
  final Widget? child;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final bool isLoading;
  final bool fullWidth;
  final Widget? icon;
  final EdgeInsetsGeometry? padding;

  const AppButton({
    super.key,
    this.text,
    this.child,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.md,
    this.isLoading = false,
    this.fullWidth = false,
    this.icon,
    this.padding,
  }) : assert(text != null || child != null, 'Either text or child must be provided');

  @override
  Widget build(BuildContext context) {
    final buttonChild = _buildChild();
    final buttonStyle = _getButtonStyle();

    final button = switch (variant) {
      AppButtonVariant.primary => ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: buttonStyle,
          child: buttonChild,
        ),
      AppButtonVariant.secondary => ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: buttonStyle,
          child: buttonChild,
        ),
      AppButtonVariant.destructive => ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: buttonStyle,
          child: buttonChild,
        ),
      AppButtonVariant.outline => OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: buttonStyle,
          child: buttonChild,
        ),
      AppButtonVariant.ghost => TextButton(
          onPressed: isLoading ? null : onPressed,
          style: buttonStyle,
          child: buttonChild,
        ),
    };

    return fullWidth ? SizedBox(width: double.infinity, child: button) : button;
  }

  Widget _buildChild() {
    if (isLoading) {
      return SizedBox(
        height: _getIconSize(),
        width: _getIconSize(),
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(_getLoadingColor()),
        ),
      );
    }

    if (child != null) {
      return child!;
    }

    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          icon!,
          const SizedBox(width: AppSpacing.xs),
          Text(text!),
        ],
      );
    }

    return Text(text!);
  }

  ButtonStyle _getButtonStyle() {
    final baseStyle = ButtonStyle(
      padding: WidgetStateProperty.all(
        padding ?? _getDefaultPadding(),
      ),
      shape: WidgetStateProperty.all(
        RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
        ),
      ),
      textStyle: WidgetStateProperty.all(AppTextStyles.button),
      minimumSize: WidgetStateProperty.all(Size(0, _getHeight())),
    );

    return switch (variant) {
      AppButtonVariant.primary => baseStyle.copyWith(
          backgroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.disabled)) {
              return AppColors.muted;
            }
            return AppColors.primary;
          }),
          foregroundColor: WidgetStateProperty.all(AppColors.primaryForeground),
          elevation: WidgetStateProperty.all(0),
        ),
      AppButtonVariant.secondary => baseStyle.copyWith(
          backgroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.disabled)) {
              return AppColors.muted;
            }
            return AppColors.secondary;
          }),
          foregroundColor: WidgetStateProperty.all(AppColors.secondaryForeground),
          elevation: WidgetStateProperty.all(0),
        ),
      AppButtonVariant.destructive => baseStyle.copyWith(
          backgroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.disabled)) {
              return AppColors.muted;
            }
            return AppColors.destructive;
          }),
          foregroundColor: WidgetStateProperty.all(AppColors.destructiveForeground),
          elevation: WidgetStateProperty.all(0),
        ),
      AppButtonVariant.outline => baseStyle.copyWith(
          backgroundColor: WidgetStateProperty.all(Colors.transparent),
          foregroundColor: WidgetStateProperty.all(AppColors.foreground),
          side: WidgetStateProperty.all(
            const BorderSide(color: AppColors.input),
          ),
        ),
      AppButtonVariant.ghost => baseStyle.copyWith(
          backgroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.hovered)) {
              return AppColors.accent;
            }
            return Colors.transparent;
          }),
          foregroundColor: WidgetStateProperty.all(AppColors.foreground),
        ),
    };
  }

  EdgeInsetsGeometry _getDefaultPadding() {
    return switch (size) {
      AppButtonSize.sm => const EdgeInsets.symmetric(
          horizontal: AppSpacing.paddingMD,
          vertical: AppSpacing.paddingXS,
        ),
      AppButtonSize.md => const EdgeInsets.symmetric(
          horizontal: AppSpacing.paddingLG,
          vertical: AppSpacing.paddingSM,
        ),
      AppButtonSize.lg => const EdgeInsets.symmetric(
          horizontal: AppSpacing.paddingXL,
          vertical: AppSpacing.paddingMD,
        ),
    };
  }

  double _getHeight() {
    return switch (size) {
      AppButtonSize.sm => AppSpacing.buttonSM,
      AppButtonSize.md => AppSpacing.buttonMD,
      AppButtonSize.lg => AppSpacing.buttonLG,
    };
  }

  double _getIconSize() {
    return switch (size) {
      AppButtonSize.sm => AppSpacing.iconSM,
      AppButtonSize.md => AppSpacing.iconMD,
      AppButtonSize.lg => AppSpacing.iconLG,
    };
  }

  Color _getLoadingColor() {
    return switch (variant) {
      AppButtonVariant.primary => AppColors.primaryForeground,
      AppButtonVariant.secondary => AppColors.secondaryForeground,
      AppButtonVariant.destructive => AppColors.destructiveForeground,
      AppButtonVariant.outline => AppColors.foreground,
      AppButtonVariant.ghost => AppColors.foreground,
    };
  }
}