import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../scanner_tab_scope.dart';
import '../providers/scanner_session_provider.dart';
import '../theme/scanner_theme.dart';
import '../../../shared/utils/navigation_utils.dart';
import '../../../shared/widgets/app_pop_scope.dart';
import '../widgets/migration_toast.dart';
import '../widgets/scanner_header.dart';
import 'scanner_home_screen.dart';
import 'scanner_profile_screen.dart';
import 'scanner_records_screen.dart';
import 'scanner_scan_screen.dart';
import 'scanner_sync_screen.dart';

/// Scanner portal tabs: Home · Sync · Scanner · Records · Profile
class ScannerPortalScreen extends StatefulWidget {
  final int initialIndex;

  const ScannerPortalScreen({super.key, this.initialIndex = 0});

  static const tabCount = 5;
  static const scanTabIndex = 2;

  @override
  State<ScannerPortalScreen> createState() => _ScannerPortalScreenState();
}

class _ScannerPortalScreenState extends State<ScannerPortalScreen> {
  late int _index;
  String? _lastToastId;
  ScannerSessionProvider? _scanner;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex.clamp(0, ScannerPortalScreen.tabCount - 1);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _scanner = context.read<ScannerSessionProvider>();
      _scanner!.addListener(_onScannerUpdate);
    });
  }

  @override
  void dispose() {
    _scanner?.removeListener(_onScannerUpdate);
    super.dispose();
  }

  void _onScannerUpdate() {
    if (!mounted) return;
    final scanner = context.read<ScannerSessionProvider>();
    final alert = scanner.migrationAlert;
    if (alert == null || alert.id == _lastToastId) return;
    _lastToastId = alert.id;
    MigrationToast.show(context, record: alert);
    scanner.clearMigrationAlert();
  }

  String _titleForIndex(int index) {
    switch (index) {
      case 0:
        return 'Dashboard';
      case 1:
        return 'Sync';
      case 2:
        return 'Scanner';
      case 3:
        return 'Records';
      case 4:
        return 'Profile';
      default:
        return 'Scanner';
    }
  }

  void _goTo(int index) {
    if (_index == index) return;
    setState(() => _index = index);
  }

  Widget _buildTab() {
    switch (_index) {
      case 0:
        return const ScannerHomeScreen(key: PageStorageKey('scanner_home'));
      case 1:
        return const ScannerSyncScreen(key: PageStorageKey('scanner_sync'));
      case 2:
        return const ScannerScanScreen(key: ValueKey('scanner_scan'));
      case 3:
        return const ScannerRecordsScreen(key: PageStorageKey('scanner_records'));
      case 4:
        return const ScannerProfileScreen(key: PageStorageKey('scanner_profile'));
      default:
        return const SizedBox.shrink();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isScanTab = _index == ScannerPortalScreen.scanTabIndex;

    return AppPopScope(
      onBack: () => handleScannerBack(
        context,
        tabIndex: _index,
        goToHomeTab: () => _goTo(0),
      ),
      child: ScannerTabScope(
        index: _index,
        goTo: _goTo,
        child: Scaffold(
          backgroundColor: isScanTab ? Colors.black : ScannerTheme.surface,
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (!isScanTab)
                ColoredBox(
                  color: ScannerTheme.surface,
                  child: SafeArea(
                    bottom: false,
                    child: ScannerHeader(title: _titleForIndex(_index)),
                  ),
                ),
              Expanded(
                child: ColoredBox(
                  color: isScanTab ? Colors.black : ScannerTheme.surface,
                  child: _buildTab(),
                ),
              ),
            ],
          ),
          bottomNavigationBar: isScanTab
              ? null
              : _ScannerBottomBar(
                  currentIndex: _index,
                  onSelect: _goTo,
                ),
        ),
      ),
    );
  }
}

class _ScannerBottomBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onSelect;

  const _ScannerBottomBar({
    required this.currentIndex,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.black.withValues(alpha: 0.06)),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 54,
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Row(
                  children: [
                    _NavTab(
                      icon: Icons.home_outlined,
                      activeIcon: Icons.home_rounded,
                      label: 'Home',
                      selected: currentIndex == 0,
                      onTap: () => onSelect(0),
                    ),
                    _NavTab(
                      icon: Icons.sync_outlined,
                      activeIcon: Icons.sync_rounded,
                      label: 'Sync',
                      selected: currentIndex == 1,
                      onTap: () => onSelect(1),
                    ),
                    const SizedBox(width: 52),
                    _NavTab(
                      icon: Icons.receipt_long_outlined,
                      activeIcon: Icons.receipt_long_rounded,
                      label: 'Records',
                      selected: currentIndex == 3,
                      onTap: () => onSelect(3),
                    ),
                    _NavTab(
                      icon: Icons.person_outline_rounded,
                      activeIcon: Icons.person_rounded,
                      label: 'Profile',
                      selected: currentIndex == 4,
                      onTap: () => onSelect(4),
                    ),
                  ],
                ),
              ),
              Positioned(
                top: -12,
                child: _ScanFab(
                  selected: currentIndex == ScannerPortalScreen.scanTabIndex,
                  onTap: () => onSelect(ScannerPortalScreen.scanTabIndex),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavTab extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _NavTab({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  selected ? activeIcon : icon,
                  size: 20,
                  color: selected ? ScannerTheme.primary : ScannerTheme.textMuted,
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    color: selected ? ScannerTheme.primary : ScannerTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ScanFab extends StatelessWidget {
  final bool selected;
  final VoidCallback onTap;

  const _ScanFab({required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: ScannerTheme.primaryGradient,
              border: Border.all(color: Colors.white, width: 2.5),
              boxShadow: [
                BoxShadow(
                  color: ScannerTheme.primary.withValues(alpha: selected ? 0.35 : 0.22),
                  blurRadius: selected ? 12 : 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: const Icon(
              Icons.qr_code_scanner_rounded,
              color: Colors.white,
              size: 22,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'Scan',
            style: TextStyle(
              fontSize: 9,
              fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
              color: selected ? ScannerTheme.primary : ScannerTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}
