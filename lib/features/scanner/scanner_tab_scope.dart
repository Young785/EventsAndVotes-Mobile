import 'package:flutter/material.dart';

/// Lets scanner child screens switch tabs (e.g. Home → Scan) without GoRouter shells.
class ScannerTabScope extends InheritedWidget {
  final int index;
  final void Function(int) goTo;

  const ScannerTabScope({
    super.key,
    required this.index,
    required this.goTo,
    required super.child,
  });

  static ScannerTabScope of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<ScannerTabScope>();
    assert(scope != null, 'ScannerTabScope not found');
    return scope!;
  }

  static ScannerTabScope? maybeOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<ScannerTabScope>();
  }

  @override
  bool updateShouldNotify(ScannerTabScope old) => old.index != index;
}
