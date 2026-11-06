import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/constants/app_constants.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_controller.dart';
import 'core/router/app_router.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/scanner/providers/scanner_session_provider.dart';
import 'shared/widgets/app_loader.dart';
import 'shared/widgets/app_pop_scope.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (kDebugMode) {
    debugPrint('[DEBUG] API base URL: ${AppConstants.baseUrl}');
  }

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    systemNavigationBarColor: Colors.white,
    systemNavigationBarIconBrightness: Brightness.dark,
  ));

  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  final authProvider = AuthProvider();
  final scannerProvider = ScannerSessionProvider();
  final themeController = ThemeController();
  await authProvider.initialize();
  await scannerProvider.initialize();
  await themeController.load();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider.value(value: scannerProvider),
        ChangeNotifierProvider.value(value: themeController),
      ],
      child: const EventsVotesApp(),
    ),
  );
}

class EventsVotesApp extends StatefulWidget {
  const EventsVotesApp({super.key});

  @override
  State<EventsVotesApp> createState() => _EventsVotesAppState();
}

class _EventsVotesAppState extends State<EventsVotesApp> {
  late final AuthProvider _authProvider;
  late final ScannerSessionProvider _scannerProvider;
  late final GoRouterWrapper _routerWrapper;

  @override
  void initState() {
    super.initState();
    _authProvider = context.read<AuthProvider>();
    _scannerProvider = context.read<ScannerSessionProvider>();
    _routerWrapper = GoRouterWrapper(_authProvider, _scannerProvider);
  }

  @override
  void dispose() {
    _routerWrapper.dispose();
    _scannerProvider.disposeMigration();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<AuthProvider>();
    context.watch<ScannerSessionProvider>();

    final theme = context.watch<ThemeController>();

    return MaterialApp.router(
      title: 'Evote',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: theme.mode,
      routerConfig: _routerWrapper.router,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: MediaQuery.textScalerOf(context).clamp(
              minScaleFactor: 0.9,
              maxScaleFactor: 1.15,
            ),
          ),
          // go_router can briefly pass a null child during redirects — never show a blank screen
          child: Listener(
            behavior: HitTestBehavior.translucent,
            onPointerDown: (event) {
              final focus = FocusManager.instance.primaryFocus;
              if (focus == null || !focus.hasFocus) return;
              final box = focus.context?.findRenderObject();
              if (box is RenderBox && box.hasSize) {
                final rect = box.localToGlobal(Offset.zero) & box.size;
                if (rect.contains(event.position)) return;
              }
              focus.unfocus();
            },
            child: AppPopScope(
              child: child ??
                  const Scaffold(
                    backgroundColor: Colors.white,
                    body: Center(child: AppLoader()),
                  ),
            ),
          ),
        );
      },
    );
  }
}

class GoRouterWrapper {
  final AuthProvider authProvider;
  final ScannerSessionProvider scannerProvider;
  late final router = createRouter(authProvider, scannerProvider);

  GoRouterWrapper(this.authProvider, this.scannerProvider);

  void dispose() {
    router.dispose();
  }
}
