import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

typedef AuthErrorCallback = void Function(int statusCode, Map<String, dynamic>? data);

class ApiClient {
  static ApiClient? _instance;
  late final Dio _dio;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  AuthErrorCallback? onAuthError;

  ApiClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (options.extra['skipAuth'] == true) {
            handler.next(options);
            return;
          }
          final token = await _secureStorage.read(key: AppConstants.tokenKey);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          final status = error.response?.statusCode;
          if (status == 401 || status == 403) {
            final data = error.response?.data;
            onAuthError?.call(
              status!,
              data is Map<String, dynamic> ? data : null,
            );
          }
          handler.next(error);
        },
      ),
    );
  }

  static ApiClient get instance {
    _instance ??= ApiClient._();
    return _instance!;
  }

  Dio get dio => _dio;

  Future<void> saveToken(String token) =>
      _secureStorage.write(key: AppConstants.tokenKey, value: token);

  Future<void> clearToken() => _secureStorage.delete(key: AppConstants.tokenKey);

  Future<String?> getToken() => _secureStorage.read(key: AppConstants.tokenKey);

  static Options _publicOptions([Options? options]) {
    final base = options ?? Options();
    return base.copyWith(
      extra: {...?base.extra, 'skipAuth': true},
    );
  }

  Future<Response> get(
    String path, {
    Map<String, dynamic>? params,
    Options? options,
    bool public = false,
  }) =>
      _dio.get(
        path,
        queryParameters: params,
        options: public ? _publicOptions(options) : options,
      );

  Future<Response> post(
    String path, {
    dynamic data,
    Options? options,
    bool public = false,
  }) =>
      _dio.post(
        path,
        data: data,
        options: public ? _publicOptions(options) : options,
      );

  Future<Response> put(String path, {dynamic data}) =>
      _dio.put(path, data: data);

  Future<Response> delete(String path) => _dio.delete(path);

  Future<Response> postMultipart(
    String path, {
    required FormData data,
  }) =>
      _dio.post(
        path,
        data: data,
        options: Options(contentType: 'multipart/form-data'),
      );
}
