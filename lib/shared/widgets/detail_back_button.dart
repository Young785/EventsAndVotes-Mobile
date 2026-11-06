import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../utils/navigation_utils.dart';

class DetailBackButton extends StatelessWidget {
  final VoidCallback? onTap;

  const DetailBackButton({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    final reported = MediaQuery.viewPaddingOf(context).top;
    final top = (reported < 47 ? 59.0 : reported) + 8;
    return Padding(
      padding: EdgeInsets.only(left: 16, top: top),
      child: Material(
        color: Colors.black.withValues(alpha: 0.45),
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap ?? () => popPage(context),
          child: const SizedBox(
            width: 40,
            height: 40,
            child: Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Colors.white,
              size: 18,
            ),
          ),
        ),
      ),
    );
  }
}

/// Back control on the left, title locked to the center of the page.
class CenteredPageHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onBack;

  const CenteredPageHeader({super.key, required this.title, this.onBack});

  @override
  Widget build(BuildContext context) {
    final colors = AppPalette.of(context);
    return SafeArea(
      bottom: false,
      child: SizedBox(
        height: 52,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 56),
              child: Text(
                title,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: colors.text,
                  letterSpacing: -0.2,
                ),
              ),
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: IconButton(
                onPressed: onBack ?? () => popPage(context),
                icon: Icon(
                  Icons.arrow_back_ios_new_rounded,
                  color: colors.text,
                  size: 18,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
