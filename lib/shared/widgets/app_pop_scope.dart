import 'package:flutter/material.dart';
import '../utils/navigation_utils.dart';

/// Intercepts the system back gesture / back button so the app navigates
/// in-app instead of closing when there is nowhere to pop on the stack.
class AppPopScope extends StatelessWidget {
  final Widget child;
  final VoidCallback? onBack;

  const AppPopScope({
    super.key,
    required this.child,
    this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        if (onBack != null) {
          onBack!();
        } else {
          handleAppBack(context);
        }
      },
      child: child,
    );
  }
}
