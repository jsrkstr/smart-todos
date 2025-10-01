import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum TimerMode {
  focus,
  shortBreak,
  longBreak,
}

class PomodoroState {
  final TimerMode mode;
  final int timeLeft; // in seconds
  final bool isActive;
  final bool isShown;
  final int pomodorosCompleted;
  final String? selectedTaskId;

  const PomodoroState({
    this.mode = TimerMode.focus,
    this.timeLeft = 25 * 60, // 25 minutes default
    this.isActive = false,
    this.isShown = false,
    this.pomodorosCompleted = 0,
    this.selectedTaskId,
  });

  PomodoroState copyWith({
    TimerMode? mode,
    int? timeLeft,
    bool? isActive,
    bool? isShown,
    int? pomodorosCompleted,
    String? selectedTaskId,
  }) {
    return PomodoroState(
      mode: mode ?? this.mode,
      timeLeft: timeLeft ?? this.timeLeft,
      isActive: isActive ?? this.isActive,
      isShown: isShown ?? this.isShown,
      pomodorosCompleted: pomodorosCompleted ?? this.pomodorosCompleted,
      selectedTaskId: selectedTaskId ?? this.selectedTaskId,
    );
  }

  bool get isTimeUp => timeLeft == 0;

  int get defaultDuration {
    switch (mode) {
      case TimerMode.focus:
        return 25 * 60;
      case TimerMode.shortBreak:
        return 5 * 60;
      case TimerMode.longBreak:
        return 15 * 60;
    }
  }
}

class PomodoroNotifier extends StateNotifier<PomodoroState> {
  Timer? _timer;

  PomodoroNotifier() : super(const PomodoroState());

  void start() {
    if (state.isActive) return;

    state = state.copyWith(isActive: true);
    _startTimer();
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    state = state.copyWith(
      isActive: false,
      timeLeft: state.defaultDuration,
    );
  }

  void pause() {
    _timer?.cancel();
    _timer = null;
    state = state.copyWith(isActive: false);
  }

  void resume() {
    if (state.isActive) return;
    state = state.copyWith(isActive: true);
    _startTimer();
  }

  void setMode(TimerMode mode) {
    _timer?.cancel();
    _timer = null;

    final newState = PomodoroState(
      mode: mode,
      timeLeft: _getDurationForMode(mode),
      isActive: false,
      isShown: state.isShown,
      pomodorosCompleted: state.pomodorosCompleted,
      selectedTaskId: state.selectedTaskId,
    );

    state = newState;
  }

  void show({String? taskId}) {
    state = state.copyWith(
      isShown: true,
      selectedTaskId: taskId,
    );
  }

  void hide() {
    state = state.copyWith(isShown: false);
  }

  void startFocus(String taskId) {
    setMode(TimerMode.focus);
    state = state.copyWith(
      selectedTaskId: taskId,
      isShown: true,
    );
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (state.timeLeft > 0) {
        state = state.copyWith(timeLeft: state.timeLeft - 1);
      } else {
        // Timer completed
        _handleTimerComplete();
      }
    });
  }

  void _handleTimerComplete() {
    _timer?.cancel();
    _timer = null;

    if (state.mode == TimerMode.focus) {
      final newCount = state.pomodorosCompleted + 1;
      state = state.copyWith(
        isActive: false,
        pomodorosCompleted: newCount,
      );

      // TODO: Send notification that focus session is complete
      // TODO: Suggest break based on count (short break or long break every 4 pomodoros)
    } else {
      // Break is complete
      state = state.copyWith(isActive: false);
      // TODO: Send notification that break is complete
    }
  }

  int _getDurationForMode(TimerMode mode) {
    switch (mode) {
      case TimerMode.focus:
        return 25 * 60;
      case TimerMode.shortBreak:
        return 5 * 60;
      case TimerMode.longBreak:
        return 15 * 60;
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

final pomodoroProvider = StateNotifierProvider<PomodoroNotifier, PomodoroState>((ref) {
  return PomodoroNotifier();
});
