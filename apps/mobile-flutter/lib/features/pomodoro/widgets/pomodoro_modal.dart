import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_text_styles.dart';
import '../providers/pomodoro_provider.dart';

class PomodoroModal extends ConsumerWidget {
  const PomodoroModal({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pomodoroState = ref.watch(pomodoroProvider);

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(AppSpacing.paddingXL),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLG),
        ),
        padding: const EdgeInsets.all(AppSpacing.paddingXL),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Pomodoro Timer',
                  style: AppTextStyles.h3,
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () {
                    ref.read(pomodoroProvider.notifier).hide();
                    Navigator.of(context).pop();
                  },
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.xl2),

            // Timer display
            _buildTimerCircle(pomodoroState),

            const SizedBox(height: AppSpacing.xl2),

            // Control buttons
            _buildControls(context, ref, pomodoroState),

            const SizedBox(height: AppSpacing.xl),

            // Stats
            Text(
              'Completed today: ${pomodoroState.pomodorosCompleted}',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.mutedForeground,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimerCircle(PomodoroState state) {
    final minutes = state.timeLeft ~/ 60;
    final seconds = state.timeLeft % 60;
    final timeString = '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';

    final progress = state.timeLeft / state.defaultDuration;

    return SizedBox(
      width: 250,
      height: 250,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background circle
          CustomPaint(
            size: const Size(250, 250),
            painter: _CirclePainter(
              progress: 1.0,
              color: AppColors.muted.withOpacity(0.3),
            ),
          ),

          // Progress circle
          CustomPaint(
            size: const Size(250, 250),
            painter: _CirclePainter(
              progress: progress,
              color: AppColors.primary,
            ),
          ),

          // Time text
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (state.mode != TimerMode.focus)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    _getModeLabel(state.mode),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.mutedForeground,
                    ),
                  ),
                ),
              Text(
                timeString,
                style: TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.bold,
                  color: AppColors.foreground,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildControls(BuildContext context, WidgetRef ref, PomodoroState state) {
    if (!state.isActive && state.timeLeft == state.defaultDuration) {
      // Not started
      return SizedBox(
        width: 200,
        child: ElevatedButton(
          onPressed: () {
            ref.read(pomodoroProvider.notifier).start();
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.primaryForeground,
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.paddingMD),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppSpacing.radiusLG),
            ),
          ),
          child: const Text('Start', style: TextStyle(fontSize: 18)),
        ),
      );
    } else if (state.isActive) {
      // Running
      return Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 120,
            child: OutlinedButton(
              onPressed: () {
                ref.read(pomodoroProvider.notifier).pause();
              },
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.paddingMD),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusLG),
                ),
              ),
              child: const Text('Pause'),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          SizedBox(
            width: 120,
            child: OutlinedButton(
              onPressed: () {
                ref.read(pomodoroProvider.notifier).stop();
              },
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.paddingMD),
                side: BorderSide(color: AppColors.destructive),
                foregroundColor: AppColors.destructive,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusLG),
                ),
              ),
              child: const Text('Stop'),
            ),
          ),
        ],
      );
    } else {
      // Paused
      return Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 120,
            child: ElevatedButton(
              onPressed: () {
                ref.read(pomodoroProvider.notifier).resume();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.primaryForeground,
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.paddingMD),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusLG),
                ),
              ),
              child: const Text('Resume'),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          SizedBox(
            width: 120,
            child: OutlinedButton(
              onPressed: () {
                ref.read(pomodoroProvider.notifier).stop();
              },
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.paddingMD),
                side: BorderSide(color: AppColors.destructive),
                foregroundColor: AppColors.destructive,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusLG),
                ),
              ),
              child: const Text('Stop'),
            ),
          ),
        ],
      );
    }
  }

  String _getModeLabel(TimerMode mode) {
    switch (mode) {
      case TimerMode.focus:
        return 'Focus';
      case TimerMode.shortBreak:
        return 'Short Break';
      case TimerMode.longBreak:
        return 'Long Break';
    }
  }
}

class _CirclePainter extends CustomPainter {
  final double progress;
  final Color color;

  _CirclePainter({
    required this.progress,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 10;

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 12
      ..strokeCap = StrokeCap.round;

    const startAngle = -pi / 2;
    final sweepAngle = 2 * pi * progress;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      paint,
    );
  }

  @override
  bool shouldRepaint(_CirclePainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.color != color;
  }
}
