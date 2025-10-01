import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/chat_service.dart';
import '../../../shared/providers/api_provider.dart';
import '../models/chat_message.dart';

/// Chat state
class ChatState {
  final List<ChatMessage> messages;
  final bool isLoading;
  final String? error;

  const ChatState({
    this.messages = const [],
    this.isLoading = false,
    this.error,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    String? error,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Chat notifier
class ChatNotifier extends StateNotifier<ChatState> {
  final ChatService _chatService;
  final String? taskId;

  ChatNotifier(this._chatService, this.taskId) : super(const ChatState());

  /// Send a message
  Future<void> sendMessage(String message) async {
    if (message.trim().isEmpty) return;

    // Add user message to state
    final userMessage = ChatMessage(
      id: DateTime.now().toString(),
      role: MessageRole.user,
      content: message,
      taskId: taskId,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    state = state.copyWith(
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    );

    try {
      // Send message to API
      final response = await _chatService.sendMessage(
        message: message,
        taskId: taskId,
      );

      // Add assistant response to state
      final assistantMessage = ChatMessage(
        id: DateTime.now().toString(),
        role: MessageRole.assistant,
        content: response,
        taskId: taskId,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      state = state.copyWith(
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      );
    } catch (e) {
      print('Error sending message: $e');
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );

      // Add error message to chat
      final errorMessage = ChatMessage(
        id: DateTime.now().toString(),
        role: MessageRole.assistant,
        content: 'Sorry, I encountered an error: ${e.toString()}',
        taskId: taskId,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      state = state.copyWith(
        messages: [...state.messages, errorMessage],
      );
    }
  }

  /// Load chat history
  Future<void> loadHistory() async {
    state = state.copyWith(isLoading: true);

    try {
      final history = await _chatService.getChatHistory(taskId: taskId);

      final messages = history
          .map((data) => ChatMessage.fromJson(data))
          .toList();

      state = state.copyWith(
        messages: messages,
        isLoading: false,
      );
    } catch (e) {
      print('Error loading chat history: $e');
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Clear messages
  void clearMessages() {
    state = const ChatState();
  }
}

/// Chat provider factory
final chatProvider = StateNotifierProvider.family<ChatNotifier, ChatState, String?>((ref, taskId) {
  final dio = ref.watch(dioProvider);
  final chatService = ChatService(dio);
  return ChatNotifier(chatService, taskId);
});
