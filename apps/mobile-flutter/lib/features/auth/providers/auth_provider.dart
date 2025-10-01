import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/user.dart';
import '../../../core/api/api_service.dart';
import '../../../core/api/dio_client.dart';
import '../../../shared/providers/api_provider.dart';

/// Auth state
class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Auth notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService;

  AuthNotifier(this._apiService) : super(const AuthState()) {
    _checkSession();
  }

  /// Check if user is already logged in
  Future<void> _checkSession() async {
    state = state.copyWith(isLoading: true);
    try {
      final token = await DioClient.getToken();
      print('_checkSession - Token exists: ${token != null}');

      if (token == null) {
        print('_checkSession - No token, user not logged in');
        state = const AuthState(isLoading: false);
        return;
      }

      final user = await _apiService.getSession();
      print('_checkSession - User fetched: ${user?.email}');
      state = AuthState(user: user, isLoading: false);
    } catch (e) {
      print('_checkSession - Error: $e');
      state = const AuthState(isLoading: false);
    }
  }

  /// Login with email and password
  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiService.login(email: email, password: password);

      // Save token if provided
      if (response['token'] != null) {
        await DioClient.saveToken(response['token']);
      }

      // Get user from response or fetch session
      User? user;
      if (response['user'] != null) {
        user = User.fromJson(response['user']);
      } else {
        user = await _apiService.getSession();
      }

      state = AuthState(user: user, isLoading: false);
      return true;
    } catch (e) {
      print('Login error: $e');
      state = AuthState(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  /// Register new user
  Future<bool> register({
    required String email,
    required String password,
    String? name,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiService.register(
        email: email,
        password: password,
        name: name,
      );

      // Save token if provided
      if (response['token'] != null) {
        await DioClient.saveToken(response['token']);
      }

      // Get user session
      final user = await _apiService.getSession();
      state = AuthState(user: user, isLoading: false);
      return true;
    } catch (e) {
      state = AuthState(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  /// Logout
  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    try {
      await _apiService.logout();
      state = const AuthState(isLoading: false);
    } catch (e) {
      state = AuthState(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Auth provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AuthNotifier(apiService);
});