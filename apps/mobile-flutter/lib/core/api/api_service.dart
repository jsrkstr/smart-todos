import 'package:dio/dio.dart';
import '../../config/api_config.dart';
import '../models/user.dart';
import '../models/task.dart';
import 'dio_client.dart';

/// API service for making HTTP requests to Next.js backend
class ApiService {
  final DioClient _dioClient;
  late final Dio _dio;

  ApiService(this._dioClient) {
    _dio = _dioClient.dio;
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  /// Login with email and password
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post(
      ApiConfig.authCredentials,
      data: {
        'email': email,
        'password': password,
      },
    );
    return response.data;
  }

  /// Register new user
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    String? name,
  }) async {
    final response = await _dio.post(
      ApiConfig.authRegister,
      data: {
        'email': email,
        'password': password,
        if (name != null) 'name': name,
      },
    );
    return response.data;
  }

  /// Get current session
  Future<User?> getSession() async {
    try {
      print('getSession - Making request to ${ApiConfig.authSession}');
      final response = await _dio.get(ApiConfig.authSession);
      print('getSession - Response status: ${response.statusCode}');
      print('getSession - Response data: ${response.data}');

      // Check if response has user data
      if (response.data != null) {
        // API returns { isAuthenticated: true, user: {...} }
        if (response.data['user'] != null) {
          final user = User.fromJson(response.data['user']);
          print('getSession - User parsed: ${user.email}');
          return user;
        }
        // Also check if isAuthenticated is false
        if (response.data['isAuthenticated'] == false) {
          print('getSession - Not authenticated');
          return null;
        }
      }
      print('getSession - No user in response');
      return null;
    } catch (e) {
      print('getSession - Error: $e');
      return null;
    }
  }

  /// Logout
  Future<void> logout() async {
    await _dio.post(ApiConfig.authLogout);
    await DioClient.clearToken();
  }

  // ============================================================================
  // Tasks
  // ============================================================================

  /// Get all tasks
  Future<List<Task>> getTasks() async {
    print('getTasks - Making request to ${ApiConfig.tasks}');
    final response = await _dio.get(ApiConfig.tasks);
    print('getTasks - Response status: ${response.statusCode}');
    print('getTasks - Response data type: ${response.data.runtimeType}');
    print('getTasks - Response data: ${response.data}');
    final List<dynamic> data = response.data;
    print('getTasks - Parsing ${data.length} tasks');
    final tasks = data.map((json) => Task.fromJson(json)).toList();
    print('getTasks - Parsed ${tasks.length} tasks successfully');
    return tasks;
  }

  /// Get task by ID
  Future<Task> getTask(String id) async {
    final response = await _dio.get('${ApiConfig.tasks}/$id');
    return Task.fromJson(response.data);
  }

  /// Create new task
  Future<Task> createTask(Map<String, dynamic> data) async {
    final response = await _dio.post(ApiConfig.tasks, data: data);
    return Task.fromJson(response.data);
  }

  /// Update task
  Future<Task> updateTask(String id, Map<String, dynamic> data) async {
    final response = await _dio.put(
      ApiConfig.tasks,
      data: {...data, 'id': id},
    );
    return Task.fromJson(response.data);
  }

  /// Delete task
  Future<void> deleteTask(String id) async {
    await _dio.delete(
      ApiConfig.tasks,
      data: {'id': id},
    );
  }

  /// Breakdown task into subtasks
  Future<Map<String, dynamic>> breakdownTask(String taskId) async {
    final response = await _dio.post(
      ApiConfig.tasksBreakdown,
      data: {'taskId': taskId},
    );
    return response.data;
  }

  /// Prioritize tasks
  Future<List<Task>> prioritizeTasks() async {
    final response = await _dio.post(ApiConfig.tasksPrioritize);
    final List<dynamic> data = response.data;
    return data.map((json) => Task.fromJson(json)).toList();
  }

  /// Refine task
  Future<Task> refineTask(String taskId, String userInput) async {
    final response = await _dio.post(
      ApiConfig.tasksRefine,
      data: {
        'taskId': taskId,
        'userInput': userInput,
      },
    );
    return Task.fromJson(response.data);
  }

  // ============================================================================
  // Chat
  // ============================================================================

  /// Send chat message
  Future<Map<String, dynamic>> sendChatMessage(String message) async {
    final response = await _dio.post(
      ApiConfig.chat,
      data: {'message': message},
    );
    return response.data;
  }

  /// Get chat messages
  Future<List<dynamic>> getChatMessages() async {
    final response = await _dio.get(ApiConfig.chatMessages);
    return response.data;
  }

  // ============================================================================
  // Profile
  // ============================================================================

  /// Get user profile
  Future<User> getProfile() async {
    final response = await _dio.get(ApiConfig.profile);
    return User.fromJson(response.data);
  }

  /// Update user profile
  Future<User> updateProfile(Map<String, dynamic> data) async {
    final response = await _dio.put(ApiConfig.profile, data: data);
    return User.fromJson(response.data);
  }

  /// Get psych profile
  Future<PsychProfile> getPsychProfile() async {
    final response = await _dio.get(ApiConfig.profilePsych);
    return PsychProfile.fromJson(response.data);
  }

  /// Update psych profile
  Future<PsychProfile> updatePsychProfile(Map<String, dynamic> data) async {
    final response = await _dio.put(ApiConfig.profilePsych, data: data);
    return PsychProfile.fromJson(response.data);
  }

  // ============================================================================
  // Settings
  // ============================================================================

  /// Get settings
  Future<Settings> getSettings() async {
    final response = await _dio.get(ApiConfig.settings);
    return Settings.fromJson(response.data);
  }

  /// Update settings
  Future<Settings> updateSettings(Map<String, dynamic> data) async {
    final response = await _dio.put(ApiConfig.settings, data: data);
    return Settings.fromJson(response.data);
  }

  // ============================================================================
  // Tags
  // ============================================================================

  /// Get all tags
  Future<List<Tag>> getTags() async {
    final response = await _dio.get(ApiConfig.tags);
    final List<dynamic> data = response.data;
    return data.map((json) => Tag.fromJson(json)).toList();
  }

  /// Get tag categories
  Future<List<TagCategory>> getTagCategories() async {
    final response = await _dio.get(ApiConfig.tagCategories);
    final List<dynamic> data = response.data;
    return data.map((json) => TagCategory.fromJson(json)).toList();
  }
}