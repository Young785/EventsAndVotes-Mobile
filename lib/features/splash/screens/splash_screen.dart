import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../shared/widgets/app_loader.dart';
import '../../auth/providers/auth_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    final auth = context.read<AuthProvider>();
    if (!auth.onboardingCompleted) {
      context.go('/onboarding');
    } else if (auth.isAuthenticated) {
      context.go(auth.needsVerification ? '/verification' : '/');
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: const Color(0xFF0D1B2A),
        body: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(
              'assets/images/login_hero.jpg',
              fit: BoxFit.cover,
            ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0x661A3A6B),
                    Color(0xCC0D1B2A),
                    Color(0xF01A6BFF),
                  ],
                  stops: [0, 0.45, 1],
                ),
              ),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(32, 24, 32, 36),
                child: Column(
                  children: [
                    const Spacer(),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(28),
                      child: Image.asset(
                        'assets/images/app_icon.png',
                        width: 96,
                        height: 96,
                        fit: BoxFit.cover,
                      ),
                    ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack),
                    const SizedBox(height: 28),
                    const Text(
                      'Events & Votes',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: -0.6,
                      ),
                    ).animate().fadeIn(delay: 150.ms, duration: 500.ms),
                    const SizedBox(height: 10),
                    const Text(
                      'Tickets, contests, and nights out',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: Colors.white70,
                      ),
                    ).animate().fadeIn(delay: 250.ms, duration: 500.ms),
                    const Spacer(),
                    const AppLoader(
                      color: Colors.white,
                      trackColor: Color(0x55FFFFFF),
                    ).animate().fadeIn(delay: 400.ms, duration: 500.ms),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
