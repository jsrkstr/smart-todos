import 'package:flutter/foundation.dart';

/// API configuration for connecting to the Next.js backend
class ApiConfig {
  ApiConfig._();

  /// Base URL for API requests
  /// - Development: localhost
  /// - Production: Vercel deployment
  static String get baseUrl {
    if (kDebugMode) {
      // Local development
      return 'http://localhost:3000';
    } else {
      // Production
      return 'https://smart-todos-web.vercel.app';
    }
  }

  /// API endpoints
  static const String auth = '/api/auth';
  static const String authCredentials = '/api/auth/credentials';
  static const String authSession = '/api/auth/session';
  static const String authGoogle = '/api/auth/google';
  static const String authLogout = '/api/auth/logout';
  static const String authRegister = '/api/auth/register';

  static const String tasks = '/api/tasks';
  static const String tasksBreakdown = '/api/tasks/breakdown';
  static const String tasksPrioritize = '/api/tasks/prioritize';
  static const String tasksRefine = '/api/tasks/refine';

  static const String chat = '/api/chat';
  static const String agentChat = '/api/agent/chat';
  static const String chatMessages = '/api/chat-messages';

  static const String pomodoro = '/api/pomodoro';

  static const String profile = '/api/profile';
  static const String profilePsych = '/api/profile/psych';

  static const String settings = '/api/settings';

  static const String tags = '/api/tags';
  static const String tagCategories = '/api/tag-categories';

  static const String coaches = '/api/coaches';

  static const String calendarEvents = '/api/calendar-events';

  static const String notifications = '/api/notifications';

  /// HTTP headers
  static Map<String, String> get headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  /// Timeout durations
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
}