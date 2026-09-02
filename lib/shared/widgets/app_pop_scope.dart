import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../utils/navigation_utils.dart';

/// Intercepts the system back gesture / back button so the app navigates
/// in-app instead of closing when there is nowhere to pop on the stack.
///
/// When the GoRouter can pop (e.g. we're on a detail screen pushed over the
/// shell), [canPop] is set to true so the native iOS swipe-back gesture works
/// naturally. When there is nothing to pop (we're at a root shell tab), back
/// is handled by [handleAppBack] which shows the "press again to exit" toast.
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
    // Allow native pop when the router has somewhere to go back to
    // (detail screens pushed via context.push / parentNavigatorKey).
    final routerCanPop = GoRouter.of(context).canPop();

    return PopScope(
      // Let the native gesture handle the pop when there's a real back stack.
      canPop: routerCanPop,
      onPopInvokedWithResult: (didPop, _) {
        // If the native pop already fired, nothing more to do.
        if (didPop) return;
        // Otherwise (canPop was false), run our custom back logic.
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
