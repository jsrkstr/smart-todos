import 'dart:async';
import 'package:workmanager/workmanager.dart';
import '../models/physical_context.dart';
import '../api/api_service.dart';
import '../api/dio_client.dart';
import 'activity_service.dart';
import 'location_service.dart';
import 'device_state_service.dart';

/// Main service for collecting and reporting physical context
class ContextCollectionService {
  final ActivityService _activityService = ActivityService();
  final LocationService _locationService = LocationService();
  final DeviceStateService _deviceStateService = DeviceStateService();
  final ApiService _apiService = ApiService(DioClient());

  Timer? _reportTimer;
  bool _isCollecting = false;

  /// Start context collection
  Future<void> startCollection({
    Duration reportInterval = const Duration(minutes: 15),
  }) async {
    if (_isCollecting) {
      return;
    }

    _isCollecting = true;

    // Start activity detection
    await _activityService.startDetection();

    // Get initial location
    await _locationService.getCurrentLocation();

    // Load saved locations
    try {
      final locations = await _apiService.getSavedLocations();
      _locationService.setSavedLocations(locations);
    } catch (e) {
      // Continue without saved locations if API call fails
    }

    // Start periodic reporting
    _reportTimer = Timer.periodic(reportInterval, (_) async {
      await collectAndReport();
    });

    // Register background task for periodic collection
    await _registerBackgroundTask();
  }

  /// Stop context collection
  void stopCollection() {
    _isCollecting = false;
    _activityService.stopDetection();
    _reportTimer?.cancel();
    _reportTimer = null;
  }

  /// Collect current context and report to server
  Future<bool> collectAndReport() async {
    try {
      // Detect current location type
      await _locationService.detectLocationType();

      // Get device state
      final deviceState = await _deviceStateService.getDeviceState();

      // Create context object
      final context = PhysicalContext(
        activity: _activityService.currentActivity.toString(),
        confidence: _activityService.confidence,
        locationType: _locationService.currentLocationType.toString(),
        savedLocationId: _locationService.currentSavedLocation?.id,
        screenOn: deviceState.screenOn,
        battery: deviceState.batteryLevel,
        doNotDisturb: deviceState.doNotDisturb,
        timestamp: DateTime.now(),
      );

      // Report to server
      final response = await _apiService.reportContext(context);

      return response['success'] ?? false;
    } catch (e) {
      // Log error but don't throw - context collection should be resilient
      return false;
    }
  }

  /// Register background task for context collection
  Future<void> _registerBackgroundTask() async {
    await Workmanager().initialize(
      callbackDispatcher,
      isInDebugMode: false,
    );

    await Workmanager().registerPeriodicTask(
      'context-collection',
      'contextCollection',
      frequency: const Duration(minutes: 15),
      constraints: Constraints(
        networkType: NetworkType.connected,
      ),
    );
  }

  /// Check if user settings allow context collection
  Future<bool> shouldCollectContext(String? locationTrackingLevel) async {
    if (locationTrackingLevel == null || locationTrackingLevel == 'off') {
      return false;
    }

    // Check if we have necessary permissions
    final hasLocationPermission = await _locationService.checkPermissions();

    if (!hasLocationPermission && locationTrackingLevel != 'off') {
      return false;
    }

    return true;
  }

  /// Get current context without reporting
  Future<PhysicalContext> getCurrentContext() async {
    await _locationService.detectLocationType();
    final deviceState = await _deviceStateService.getDeviceState();

    return PhysicalContext(
      activity: _activityService.currentActivity.toString(),
      confidence: _activityService.confidence,
      locationType: _locationService.currentLocationType.toString(),
      savedLocationId: _locationService.currentSavedLocation?.id,
      screenOn: deviceState.screenOn,
      battery: deviceState.batteryLevel,
      doNotDisturb: deviceState.doNotDisturb,
      timestamp: DateTime.now(),
    );
  }

  /// Dispose of resources
  void dispose() {
    stopCollection();
    _activityService.dispose();
  }
}

/// Background task callback dispatcher
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    switch (task) {
      case 'contextCollection':
        // Collect and report context in background
        final service = ContextCollectionService();
        await service.collectAndReport();
        return true;
      default:
        return false;
    }
  });
}
