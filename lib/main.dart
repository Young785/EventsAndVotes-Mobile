import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/providers/ticket_cart_provider.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/scanner/providers/scanner_session_provider.dart';
import 'shared/widgets/app_pop_scope.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

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
  final ticketCartProvider = TicketCartProvider();
  await authProvider.initialize();
  await scannerProvider.initialize();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider.value(value: scannerProvider),
        ChangeNotifierProvider.value(value: ticketCartProvider),
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
    // Seed the ticket count once auth resolves
    _authProvider.addListener(_onAuthChanged);
  }

  void _onAuthChanged() {
    final cart = context.read<TicketCartProvider>();
    if (_authProvider.isAuthenticated) {
      cart.refresh();
    } else {
      cart.reset();
    }
  }

  @override
  void dispose() {
    _authProvider.removeListener(_onAuthChanged);
    _routerWrapper.dispose();
    _scannerProvider.disposeMigration();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<AuthProvider>();
    context.watch<ScannerSessionProvider>();

    return MaterialApp.router(
      title: 'Evote',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
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
          child: AppPopScope(
            child: child ??
                const Scaffold(
                  backgroundColor: Colors.white,
                  body: Center(
                    child: CircularProgressIndicator(),
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
