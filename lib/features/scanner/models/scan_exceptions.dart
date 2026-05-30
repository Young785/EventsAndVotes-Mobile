/// Thrown when the same ticket QR is scanned more than once.
class AlreadyScannedException implements Exception {
  final String message;
  final String? guestName;

  const AlreadyScannedException({
    this.message = 'You have scanned this before',
    this.guestName,
  });

  @override
  String toString() => message;
}
