import 'dart:async';
import 'dart:math';
import 'package:geolocator/geolocator.dart';
import '../models/physical_context.dart';

/// Service for location tracking and saved location detection
class LocationService {
  Position? _currentPosition;
  List<SavedLocation> _savedLocations = [];
  LocationType _currentLocationType = LocationType.unknown;
  SavedLocation? _currentSavedLocation;

  /// Check if location permissions are granted
  Future<bool> checkPermissions() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  /// Get current location
  Future<Position?> getCurrentLocation() async {
    try {
      final hasPermission = await checkPermissions();
      if (!hasPermission) {
        return null;
      }

      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
      );

      return _currentPosition;
    } catch (e) {
      print('Error getting location: $e');
      return null;
    }
  }

  /// Set saved locations for detection
  void setSavedLocations(List<SavedLocation> locations) {
    _savedLocations = locations;
  }

  /// Detect location type based on current position and saved locations
  Future<void> detectLocationType() async {
    if (_currentPosition == null) {
      await getCurrentLocation();
    }

    if (_currentPosition == null) {
      _currentLocationType = LocationType.unknown;
      _currentSavedLocation = null;
      return;
    }

    // Check if current position matches any saved location
    for (final savedLocation in _savedLocations) {
      final distance = _calculateDistance(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
        savedLocation.latitude,
        savedLocation.longitude,
      );

      if (distance <= savedLocation.radius) {
        // Determine location type from saved location name
        _currentLocationType = _inferLocationTypeFromName(savedLocation.name);
        _currentSavedLocation = savedLocation;
        return;
      }
    }

    // Not at a saved location - determine type from speed/movement
    if (_currentPosition!.speed > 5.0) {
      // Moving > 5 m/s (~18 km/h) = likely commuting
      _currentLocationType = LocationType.commuting;
    } else {
      // Unknown location, stationary or slow movement
      _currentLocationType = LocationType.unknown;
    }

    _currentSavedLocation = null;
  }

  /// Get current location type
  LocationType get currentLocationType => _currentLocationType;

  /// Get current saved location (if at one)
  SavedLocation? get currentSavedLocation => _currentSavedLocation;

  /// Calculate distance between two coordinates in meters (Haversine formula)
  double _calculateDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const double earthRadius = 6371000; // meters

    final dLat = _degreesToRadians(lat2 - lat1);
    final dLon = _degreesToRadians(lon2 - lon1);

    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_degreesToRadians(lat1)) *
            cos(_degreesToRadians(lat2)) *
            sin(dLon / 2) *
            sin(dLon / 2);

    final c = 2 * atan2(sqrt(a), sqrt(1 - a));

    return earthRadius * c;
  }

  double _degreesToRadians(double degrees) {
    return degrees * pi / 180;
  }

  /// Infer location type from saved location name
  LocationType _inferLocationTypeFromName(String name) {
    final lowerName = name.toLowerCase();

    if (lowerName.contains('home') || lowerName.contains('house')) {
      return LocationType.home;
    } else if (lowerName.contains('work') ||
        lowerName.contains('office') ||
        lowerName.contains('company')) {
      return LocationType.work;
    } else if (lowerName.contains('gym') ||
        lowerName.contains('fitness') ||
        lowerName.contains('sport')) {
      return LocationType.gym;
    } else if (lowerName.contains('shop') ||
        lowerName.contains('store') ||
        lowerName.contains('mall') ||
        lowerName.contains('market')) {
      return LocationType.shopping;
    } else if (lowerName.contains('restaurant') ||
        lowerName.contains('cafe') ||
        lowerName.contains('coffee') ||
        lowerName.contains('food')) {
      return LocationType.restaurant;
    } else {
      return LocationType.unknown;
    }
  }

  /// Start listening to location changes
  StreamSubscription<Position>? startLocationStream({
    required Function(Position) onLocationChange,
    int distanceFilter = 50, // meters
  }) {
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.medium,
      distanceFilter: 50,
    );

    return Geolocator.getPositionStream(locationSettings: locationSettings)
        .listen((position) {
      _currentPosition = position;
      onLocationChange(position);
      detectLocationType();
    });
  }
}
