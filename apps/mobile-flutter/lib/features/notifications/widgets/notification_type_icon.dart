import 'package:flutter/material.dart';
import '../../../core/models/notification.dart';
import '../../../theme/app_colors.dart';

class NotificationTypeIcon extends StatelessWidget {
  final NotificationTypeEnum type;
  final double size;

  const NotificationTypeIcon({
    super.key,
    required this.type,
    this.size = 20,
  });

  @override
  Widget build(BuildContext context) {
    IconData iconData;
    Color color;

    switch (type) {
      case NotificationTypeEnum.reminder:
        iconData = Icons.alarm;
        color = AppColors.info;
        break;
      case NotificationTypeEnum.question:
        iconData = Icons.help_outline;
        color = AppColors.warning;
        break;
      case NotificationTypeEnum.info:
        iconData = Icons.info_outline;
        color = AppColors.primary;
        break;
    }

    return Container(
      width: size + 12,
      height: size + 12,
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Icon(
        iconData,
        size: size,
        color: color,
      ),
    );
  }
}
