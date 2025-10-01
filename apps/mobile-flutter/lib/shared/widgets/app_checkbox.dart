import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

/// Circular checkbox matching the web app design
class AppCheckbox extends StatelessWidget {
  final bool value;
  final ValueChanged<bool?>? onChanged;
  final double size;

  const AppCheckbox({
    super.key,
    required this.value,
    required this.onChanged,
    this.size = 20.0,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onChanged != null ? () => onChanged!(!value) : null,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: value ? AppColors.primary : Colors.transparent,
          border: Border.all(
            color: value ? AppColors.primary : AppColors.input,
            width: 2,
          ),
        ),
        child: value
            ? const Icon(
                Icons.check,
                color: AppColors.primaryForeground,
                size: 14,
              )
            : null,
      ),
    );
  }
}

/// Alternative: Use Material Checkbox with circular shape
class AppCheckboxMaterial extends StatelessWidget {
  final bool value;
  final ValueChanged<bool?>? onChanged;
  final double size;

  const AppCheckboxMaterial({
    super.key,
    required this.value,
    required this.onChanged,
    this.size = 20.0,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Checkbox(
        value: value,
        onChanged: onChanged,
        shape: const CircleBorder(),
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.primary;
          }
          return Colors.transparent;
        }),
        checkColor: AppColors.primaryForeground,
        side: const BorderSide(color: AppColors.input, width: 2),
      ),
    );
  }
}