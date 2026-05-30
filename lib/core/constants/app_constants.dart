class AppConstants {
  static const String appName = 'Events & Votes';
  static const String baseUrl = 'https://eavapi.bizinvestify.com/api';
  static const String apiBaseOrigin = 'https://eavapi.bizinvestify.com';
  static const String frontendUrl = 'https://eav.bizinvestify.com';

  // Storage keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'auth_user';
  static const String settingsKey = 'site_settings';
  static const String themeKey = 'app_theme';
  static const String onboardingCompletedKey = 'onboarding_completed';
  static const String scanTokenKey = 'scanner_access_token';
  /// Auto-upload local scans to backend on this interval.
  static const int scannerMigrationIntervalMinutes = 20;
  /// Max migration run records shown on home.
  static const int scannerMigrationHistoryLimit = 10;

  // Pagination
  static const int defaultPageSize = 15;

  // Image placeholders (Unsplash)
  static const String heroImage =
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80';
  static const String eventPlaceholder =
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80';
  static const String votePlaceholder =
      'https://images.unsplash.com/photo-1494172961521-33799ddd43a5?w=600&q=80';
  static const String avatarPlaceholder =
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80';

  static String storageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    final clean = path.startsWith('/') ? path : '/$path';
    return '$apiBaseOrigin$clean';
  }
}
