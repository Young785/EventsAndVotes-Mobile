import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../utils/navigation_utils.dart';

/// Lets a pushed page slide back. Root tabs still use the in-app back rules.
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
    final canSlideBack = GoRouter.of(context).canPop();
    return PopScope(
      canPop: canSlideBack,
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
