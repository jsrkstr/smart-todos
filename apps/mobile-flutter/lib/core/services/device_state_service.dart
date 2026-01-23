import 'package:battery_plus/battery_plus.dart';
import 'package:flutter/services.dart';

/// Service for monitoring device state (battery, screen, DND)
class DeviceStateService {
  final Battery _battery = Battery();

  /// Get current battery level (0-100)
  Future<int> getBatteryLevel() async {
    try {
      return await _battery.batteryLevel;
    } catch (e) {
      return 100; // Default to 100 if unavailable
    }
  }

  /// Check if device is charging
  Future<bool> isCharging() async {
    try {
      final state = await _battery.batteryState;
      return state == BatteryState.charging || state == BatteryState.full;
    } catch (e) {
      return false;
    }
  }

  /// Check if Do Not Disturb is enabled
  /// Note: This requires platform-specific implementation
  Future<bool> isDoNotDisturbEnabled() async {
    try {
      // Platform channel for checking DND status
      const platform = MethodChannel('com.smarttodos.app/device_state');
      final bool isEnabled = await platform.invokeMethod('isDoNotDisturbEnabled');
      return isEnabled;
    } catch (e) {
      // Default to false if unavailable
      return false;
    }
  }

  /// Check if screen is on
  /// Note: This is approximated by checking if app is in foreground
  /// Actual screen state requires platform-specific implementation
  bool isScreenOn() {
    // This would require WidgetsBinding or platform-specific code
    // For now, we'll assume screen is on if context collection is running
    return true;
  }

  /// Get comprehensive device state
  Future<DeviceState> getDeviceState() async {
    final battery = await getBatteryLevel();
    final charging = await isCharging();
    final dnd = await isDoNotDisturbEnabled();
    final screenOn = isScreenOn();

    return DeviceState(
      batteryLevel: battery,
      isCharging: charging,
      doNotDisturb: dnd,
      screenOn: screenOn,
    );
  }
}

/// Device state data class
class DeviceState {
  final int batteryLevel;
  final bool isCharging;
  final bool doNotDisturb;
  final bool screenOn;

  DeviceState({
    required this.batteryLevel,
    required this.isCharging,
    required this.doNotDisturb,
    required this.screenOn,
  });
}
