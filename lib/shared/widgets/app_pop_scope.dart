import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../utils/navigation_utils.dart';

/// Intercepts the system back gesture / back button so the app navigates
/// in-app instead of closing when there is nowhere to pop on the stack.
///
/// On detail screens (pushed via context.push / parentNavigatorKey) the
/// GoRouter stack has somewhere to go, so we set canPop = true and let the
/// native iOS swipe-back / Android back gesture work naturally.
///
/// At root shell tabs there is nothing to pop, so we intercept and either
/// navigate home or show the "press again to exit" toast.
class AppPopScope extends StatelessWidget {
  final Widget child;
  final VoidCallback? onBack;

  const AppPopScope({
    super.key,
    required this.child,
    this.onBack,
  });

  /// Safely checks whether GoRouter can pop without throwing if the router
  /// is not yet in the widget tree (e.g. during the first MaterialApp build).
  static bool _safeCanPop(BuildContext context) {
    try {
      return GoRouter.of(context).canPop();
    } catch (_) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final routerCanPop = _safeCanPop(context);

    return PopScope(
      canPop: routerCanPop,
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
