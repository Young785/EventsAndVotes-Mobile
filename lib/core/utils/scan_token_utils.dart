/// Extracts the scan access token from a pasted URL or raw token string.
String extractScanToken(String input) {
  final trimmed = input.trim();
  if (trimmed.isEmpty) return trimmed;

  if (trimmed.contains('/scan/')) {
    final uri = Uri.tryParse(
      trimmed.startsWith('http') ? trimmed : 'https://$trimmed',
    );
    if (uri != null) {
      final segments = uri.pathSegments;
      final scanIndex = segments.indexOf('scan');
      if (scanIndex >= 0 && scanIndex + 1 < segments.length) {
        return segments[scanIndex + 1];
      }
    }
    final match = RegExp(r'/scan/([^/?#\s]+)').firstMatch(trimmed);
    if (match != null) return match.group(1)!;
  }

  return trimmed;
}
