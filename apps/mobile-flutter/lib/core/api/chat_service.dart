import 'package:dio/dio.dart';
import '../../config/api_config.dart';

class ChatService {
  final Dio _dio;

  ChatService(this._dio);

  /// Send a chat message to the agent (LangGraph multi-agent system)
  Future<String> sendMessage({
    required String message,
    String? taskId,
  }) async {
    try {
      final response = await _dio.post(
        ApiConfig.chat,
        data: {
          'messages': [
            {'role': 'user', 'content': message}
          ],
          if (taskId != null) 'taskId': taskId,
        },
      );

      // New response format from LangGraph agent
      // Returns: { content, role, agentType, actionItems, id, error }
      return response.data['content'] ?? 'No response';
    } on DioException catch (e) {
      print('Chat error: ${e.message}');
      if (e.response?.data != null) {
        print('Error details: ${e.response?.data}');
      }
      throw Exception('Failed to send message: ${e.message}');
    }
  }

  /// Get chat history
  Future<List<dynamic>> getChatHistory({String? taskId}) async {
    try {
      final response = await _dio.get(
        ApiConfig.chatMessages,
        queryParameters: {
          if (taskId != null) 'taskId': taskId,
        },
      );

      return response.data as List<dynamic>;
    } on DioException catch (e) {
      print('Get chat history error: ${e.message}');
      throw Exception('Failed to get chat history: ${e.message}');
    }
  }
}
