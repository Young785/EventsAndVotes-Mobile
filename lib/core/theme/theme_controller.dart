import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import 'app_theme.dart';

class ThemeController extends ChangeNotifier {
  ThemeMode mode = ThemeMode.light;

  bool get isDark => mode == ThemeMode.dark;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    mode = prefs.getString(AppConstants.themeKey) == 'dark'
        ? ThemeMode.dark
        : ThemeMode.light;
    applyOverlay();
    notifyListeners();
  }

  void applyOverlay() {
    final dark = isDark;
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: dark ? Brightness.light : Brightness.dark,
      systemNavigationBarColor: dark ? AppNight.background : Colors.white,
      systemNavigationBarIconBrightness: dark ? Brightness.light : Brightness.dark,
    ));
  }

  Future<void> setDark(bool dark) async {
    mode = dark ? ThemeMode.dark : ThemeMode.light;
    applyOverlay();
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.themeKey, dark ? 'dark' : 'light');
  }
}
