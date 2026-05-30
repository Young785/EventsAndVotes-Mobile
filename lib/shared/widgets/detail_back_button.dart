import 'package:flutter/material.dart';
import '../utils/navigation_utils.dart';

class DetailBackButton extends StatelessWidget {
  final VoidCallback? onTap;

  const DetailBackButton({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.only(left: 8, top: 4),
        child: Material(
          color: Colors.black.withValues(alpha: 0.35),
          borderRadius: BorderRadius.circular(12),
          child: InkWell(
            onTap: onTap ?? () => popPage(context),
            borderRadius: BorderRadius.circular(12),
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
      ),
    );
  }
}
