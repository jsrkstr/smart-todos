import 'dart:async';
import 'package:sensors_plus/sensors_plus.dart';
import '../models/physical_context.dart';

/// Service for detecting user activity from device sensors
class ActivityService {
  StreamSubscription<AccelerometerEvent>? _accelerometerSubscription;
  StreamSubscription<GyroscopeEvent>? _gyroscopeSubscription;

  // Activity detection state
  ActivityType _currentActivity = ActivityType.unknown;
  double _confidence = 0.0;

  // Sensor data buffers for analysis
  final List<AccelerometerEvent> _accelerometerBuffer = [];
  final List<GyroscopeEvent> _gyroscopeBuffer = [];
  static const int _bufferSize = 50; // ~1 second of data at 50Hz

  /// Start activity detection
  Future<void> startDetection() async {
    // Listen to accelerometer
    _accelerometerSubscription = accelerometerEventStream().listen((event) {
      _accelerometerBuffer.add(event);
      if (_accelerometerBuffer.length > _bufferSize) {
        _accelerometerBuffer.removeAt(0);
      }
      _analyzeActivity();
    });

    // Listen to gyroscope
    _gyroscopeSubscription = gyroscopeEventStream().listen((event) {
      _gyroscopeBuffer.add(event);
      if (_gyroscopeBuffer.length > _bufferSize) {
        _gyroscopeBuffer.removeAt(0);
      }
    });
  }

  /// Stop activity detection
  void stopDetection() {
    _accelerometerSubscription?.cancel();
    _gyroscopeSubscription?.cancel();
    _accelerometerBuffer.clear();
    _gyroscopeBuffer.clear();
  }

  /// Get current detected activity
  ActivityType get currentActivity => _currentActivity;

  /// Get confidence level of current activity
  double get confidence => _confidence;

  /// Analyze sensor data to detect activity
  void _analyzeActivity() {
    if (_accelerometerBuffer.length < 20) {
      _currentActivity = ActivityType.unknown;
      _confidence = 0.0;
      return;
    }

    // Calculate acceleration magnitude variance
    final magnitudes = _accelerometerBuffer.map((e) {
      return (e.x * e.x + e.y * e.y + e.z * e.z);
    }).toList();

    final mean = magnitudes.reduce((a, b) => a + b) / magnitudes.length;
    final variance = magnitudes
            .map((m) => (m - mean) * (m - mean))
            .reduce((a, b) => a + b) /
        magnitudes.length;

    // Simple heuristic-based activity classification
    // Note: This is a simplified version. Production would use ML models.
    if (variance < 0.5) {
      // Low variance = stationary
      _currentActivity = ActivityType.stationary;
      _confidence = 0.8;
    } else if (variance < 2.0) {
      // Medium variance = walking
      _currentActivity = ActivityType.walking;
      _confidence = 0.7;
    } else if (variance < 8.0) {
      // High variance = running
      _currentActivity = ActivityType.running;
      _confidence = 0.6;
    } else {
      // Very high variance = driving (or other vehicle)
      _currentActivity = ActivityType.driving;
      _confidence = 0.5;
    }

    // Use gyroscope for additional context
    if (_gyroscopeBuffer.isNotEmpty) {
      final gyroMagnitudes = _gyroscopeBuffer.map((e) {
        return (e.x * e.x + e.y * e.y + e.z * e.z);
      }).toList();

      final gyroMean =
          gyroMagnitudes.reduce((a, b) => a + b) / gyroMagnitudes.length;

      // High rotation suggests driving
      if (gyroMean > 1.0 && variance > 4.0) {
        _currentActivity = ActivityType.driving;
        _confidence = 0.75;
      }
    }
  }

  /// Dispose of resources
  void dispose() {
    stopDetection();
  }
}
