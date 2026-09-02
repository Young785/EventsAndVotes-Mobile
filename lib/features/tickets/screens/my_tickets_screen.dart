import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart' show Dio, Options, ResponseType;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/events_service.dart';
import '../../../core/services/tickets_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../models/ticket_model.dart';
import '../../../shared/widgets/shimmer_card.dart';
import '../../../shared/widgets/ticket_qr_image.dart';
import '../../../shared/widgets/transactions_sheet.dart';

class MyTicketsScreen extends StatefulWidget {
  const MyTicketsScreen({super.key});

  @override
  State<MyTicketsScreen> createState() => _MyTicketsScreenState();
}

class _MyTicketsScreenState extends State<MyTicketsScreen> {
  final TicketsService _service = TicketsService();
  List<TicketModel> _tickets = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await _service.getMyTickets();
      if (!mounted) return;

      final tickets = items.map((e) => TicketModel.fromJson(e)).toList();
      setState(() {
        _tickets = tickets;
        _loading = false;
      });

      // For any ticket still missing a poster, try fetching event details.
      // This handles APIs that return tickets without embedding the event image.
      await _enrichMissingPosters();
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _loading = false;
        });
      }
    }
  }

  Future<void> _enrichMissingPosters() async {
    final eventsService = EventsService();
    for (int i = 0; i < _tickets.length; i++) {
      final ticket = _tickets[i];
      if (ticket.posterUrl.isNotEmpty || ticket.eventId == null) continue;
      try {
        // getEventDetails already unwraps response.data['data']
        final event = await eventsService.getEventDetails(ticket.eventId!);
        final poster = AppConstants.storageUrl(
          event['poster_image']?.toString() ??
              event['poster']?.toString() ??
              event['image']?.toString() ??
              event['banner_image']?.toString() ??
              event['cover_image']?.toString() ??
              event['thumbnail']?.toString(),
        );
        if (poster.isNotEmpty && mounted) {
          setState(() {
            _tickets[i] = ticket.copyWith(eventPoster: poster);
          });
        }
      } catch (_) {
        // Non-fatal — card shows gradient fallback
      }
    }
  }

  void _showQrSheet(TicketModel ticket) {
    final auth = context.read<AuthProvider>();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _QrBottomSheet(
        ticket: ticket,
        token: auth.token,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isAuthenticated) {
      return _buildSignInPrompt();
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _load,
        child: _loading
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  Padding(
                    padding: EdgeInsets.all(16),
                    child: ShimmerList(count: 3, itemHeight: 200),
                  ),
                ],
              )
            : _error != null
                ? _buildError(_error!)
                : _tickets.isEmpty
                ? _buildEmpty()
                : ListView.builder(
                    physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics(),
                    ),
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                    itemCount: _tickets.length + 1, // +1 for transactions btn
                    itemBuilder: (_, i) {
                      // Last item: Transactions button
                      if (i == _tickets.length) {
                        return Padding(
                          padding: const EdgeInsets.only(top: 8, bottom: 16),
                          child: OutlinedButton.icon(
                            onPressed: () => TransactionsSheet.show(
                              context,
                              type: TransactionType.tickets,
                              token: auth.token,
                            ),
                            icon: HugeIcon(
                              icon: HugeIcons.strokeRoundedTicket01,
                              color: AppColors.primary,
                              size: 18,
                            ),
                            label: const Text('View Ticket Transactions'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.primary,
                              side: const BorderSide(
                                  color: AppColors.primary, width: 1.5),
                              padding: const EdgeInsets.symmetric(
                                  vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                          ),
                        );
                      }
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 28),
                        child: _WalletPassCard(
                          ticket: _tickets[i],
                          onShowQr: () => _showQrSheet(_tickets[i]),
                          token: auth.token,
                        ).animate().fadeIn(delay: (i * 50).ms),
                      );
                    },
                  ),
      ),
    );
  }

  Widget _buildSignInPrompt() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.confirmation_number_outlined,
              size: 48, color: AppColors.primary),
          const SizedBox(height: 16),
          const Text('Sign in to view your tickets',
              style: AppTextStyles.headlineSmall),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => context.go('/login'),
            child: const Text('Sign In'),
          ),
        ],
      ),
    );
  }

  Widget _buildError(String message) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.25),
        Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              children: [
                const Icon(Icons.wifi_off_rounded,
                    size: 48, color: AppColors.textHint),
                const SizedBox(height: 12),
                const Text('Could not load tickets',
                    style: AppTextStyles.headlineSmall),
                const SizedBox(height: 6),
                Text(message,
                    style: AppTextStyles.bodyMedium,
                    textAlign: TextAlign.center),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: _load,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmpty() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.22),
        const Center(
          child: Column(
            children: [
              Icon(Icons.confirmation_number_outlined,
                  size: 48, color: AppColors.textHint),
              SizedBox(height: 12),
              Text('No tickets yet', style: AppTextStyles.headlineSmall),
              SizedBox(height: 6),
              Text('Purchase event tickets to see them here',
                  style: AppTextStyles.bodyMedium),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: OutlinedButton.icon(
            onPressed: () => TransactionsSheet.show(
              context,
              type: TransactionType.tickets,
            ),
            icon: HugeIcon(
              icon: HugeIcons.strokeRoundedTicket01,
              color: AppColors.primary,
              size: 18,
            ),
            label: const Text('View Transaction History'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              side: const BorderSide(color: AppColors.primary, width: 1.5),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
            ),
          ),
        ),
      ],
    );
  }
}

class _WalletPassCard extends StatelessWidget {
  final TicketModel ticket;
  final VoidCallback onShowQr;
  final String? token;

  // Right stub width — notch circles are centred at this boundary
  static const double _stubW = 90.0;
  // Notch circle diameter — extends half outside card top/bottom
  static const double _notchD = 18.0;

  const _WalletPassCard({
    required this.ticket,
    required this.onShowQr,
    this.token,
  });

  @override
  Widget build(BuildContext context) {
    final poster = ticket.posterUrl.isNotEmpty ? ticket.posterUrl : null;
    final isValid = ticket.isValid;
    final statusColor = isValid ? AppColors.success : AppColors.error;
    final statusLabel =
        ticket.isUsed ? 'USED' : isValid ? 'VALID' : ticket.status.toUpperCase();

    return GestureDetector(
      onTap: onShowQr,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // ── Card body ─────────────────────────────────────────────
          Container(
            height: 138,
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(16),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ── LEFT: image background + details ─────────────
                  Expanded(
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        // Event poster fills the left section
                        poster != null
                            ? CachedNetworkImage(
                                imageUrl: poster,
                                fit: BoxFit.cover,
                                httpHeaders: token != null
                                    ? {'Authorization': 'Bearer $token'}
                                    : null,
                                errorWidget: (_, __, ___) =>
                                    _imageFallback(),
                              )
                            : _imageFallback(),
                        // Gradient: subtle top, rich dark at bottom
                        Container(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Color(0x22000000),
                                Color(0xCC000000),
                              ],
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                            ),
                          ),
                        ),
                        // Text overlay — anchored to bottom
                        Positioned(
                          left: 12,
                          right: 12,
                          bottom: 12,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Badges
                              Row(
                                children: [
                                  _Badge(
                                    label: statusLabel,
                                    color: statusColor,
                                  ),
                                  if (ticket.tierName != null) ...[
                                    const SizedBox(width: 5),
                                    _Badge(
                                      label: ticket.tierName!,
                                      color: Colors.white,
                                      textColor: Colors.black87,
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 5),
                              // Event title
                              Text(
                                ticket.eventTitle ?? 'Event Ticket',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  height: 1.15,
                                  shadows: [
                                    Shadow(blurRadius: 4, color: Colors.black54),
                                  ],
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              // Date + venue in one compact row
                              Row(
                                children: [
                                  if (ticket.startDate != null) ...[
                                    const Icon(Icons.calendar_today_rounded,
                                        size: 10, color: Colors.white70),
                                    const SizedBox(width: 3),
                                    Text(
                                      _formatDate(ticket.startDate!),
                                      style: const TextStyle(
                                          fontSize: 10, color: Colors.white70),
                                    ),
                                  ],
                                  if (ticket.startDate != null &&
                                      ticket.venue != null)
                                    const Padding(
                                      padding:
                                          EdgeInsets.symmetric(horizontal: 5),
                                      child: Text('·',
                                          style: TextStyle(
                                              color: Colors.white38,
                                              fontSize: 10)),
                                    ),
                                  if (ticket.venue != null)
                                    Flexible(
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.location_on_rounded,
                                              size: 10,
                                              color: Colors.white70),
                                          const SizedBox(width: 3),
                                          Flexible(
                                            child: Text(
                                              ticket.venue!,
                                              style: const TextStyle(
                                                  fontSize: 10,
                                                  color: Colors.white70),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  // ── RIGHT: QR stub ────────────────────────────────
                  Container(
                    width: _stubW,
                    color: const Color(0xFFF5F5F5),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'SCAN AT GATE',
                          style: TextStyle(
                            fontSize: 7,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textHint,
                            letterSpacing: 0.8,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          width: 62,
                          height: 62,
                          decoration: BoxDecoration(
                            color: AppColors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                                color: Colors.black12, width: 0.5),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(7),
                            child: TicketQrImage(
                              ticketUuid: ticket.uuid,
                              authToken: token,
                              backendQrUrl: ticket.backendQrUrl,
                              size: 62,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 6),
                          child: Text(
                            ticket.entryCode,
                            style: const TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 8,
                              color: AppColors.textSecondary,
                              letterSpacing: 0.4,
                            ),
                            textAlign: TextAlign.center,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // ── Dashed perforation line ───────────────────────────────
          Positioned(
            top: 0,
            bottom: 0,
            right: _stubW,
            child: SizedBox(
              width: 2,
              child: CustomPaint(painter: _DashedLinePainter()),
            ),
          ),
          // ── Top notch ─────────────────────────────────────────────
          Positioned(
            top: -(_notchD / 2),
            right: _stubW - (_notchD / 2),
            child: Container(
              width: _notchD,
              height: _notchD,
              decoration: const BoxDecoration(
                color: AppColors.background,
                shape: BoxShape.circle,
              ),
            ),
          ),
          // ── Bottom notch ──────────────────────────────────────────
          Positioned(
            bottom: -(_notchD / 2),
            right: _stubW - (_notchD / 2),
            child: Container(
              width: _notchD,
              height: _notchD,
              decoration: const BoxDecoration(
                color: AppColors.background,
                shape: BoxShape.circle,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Returns a smart placeholder image URL based on the event title keywords.
  String _placeholderImageUrl() {
    final title = (ticket.eventTitle ?? '').toLowerCase();
    if (title.contains('music') ||
        title.contains('festival') ||
        title.contains('concert') ||
        title.contains('show') ||
        title.contains('gig')) {
      return 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80';
    }
    if (title.contains('tech') ||
        title.contains('technology') ||
        title.contains('conference') ||
        title.contains('summit') ||
        title.contains('workshop') ||
        title.contains('ticket')) {
      return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80';
    }
    if (title.contains('business') ||
        title.contains('invest') ||
        title.contains('finance') ||
        title.contains('fintech')) {
      return 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80';
    }
    if (title.contains('sport') ||
        title.contains('football') ||
        title.contains('game') ||
        title.contains('match')) {
      return 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&q=80';
    }
    // generic event fallback
    return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80';
  }

  Widget _imageFallback() {
    final c1 = ticket.templatePrimary ?? AppColors.primary;
    final c2 = ticket.templateSecondary ?? AppColors.primary;
    final placeholderUrl = _placeholderImageUrl();

    return Stack(
      fit: StackFit.expand,
      children: [
        // Smart placeholder photo (loads from Unsplash)
        CachedNetworkImage(
          imageUrl: placeholderUrl,
          fit: BoxFit.cover,
          errorWidget: (_, __, ___) => Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [c1, c2],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
        ),
        // Overlay so text stays readable even over the photo
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0x55000000), Color(0x99000000)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
        ),
      ],
    );
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  final Color? textColor;

  const _Badge({required this.label, required this.color, this.textColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: textColor != null ? 1.0 : 0.85),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor ?? Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.5,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}



class _DashedLinePainter extends CustomPainter {
  const _DashedLinePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.grey.shade300
      ..strokeWidth = 1.5;
    const dashH = 5.0;
    const gapH = 4.0;
    var y = 0.0;
    while (y < size.height) {
      canvas.drawLine(Offset(0.5, y), Offset(0.5, y + dashH), paint);
      y += dashH + gapH;
    }
  }

  @override
  bool shouldRepaint(_DashedLinePainter old) => false;
}

class _QrBottomSheet extends StatefulWidget {
  final TicketModel ticket;
  final String? token;

  const _QrBottomSheet({required this.ticket, this.token});

  @override
  State<_QrBottomSheet> createState() => _QrBottomSheetState();
}

class _QrBottomSheetState extends State<_QrBottomSheet> {
  bool _isBusy = false;

  static String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }

  /// Generates a PDF that visually mirrors the wallet-pass ticket card.
  Future<File> _generatePdf() async {
    final service = TicketsService();
    final ticket = widget.ticket;

    // ── 1. Fetch QR bytes (authenticated) ──────────────────────────
    Uint8List? qrBytes;
    if (widget.token != null) {
      try {
        qrBytes = await service.getQrImageBytes(ticket.uuid, size: 300);
      } catch (_) {}
    }

    // ── 2. Fetch event poster bytes (public network image) ──────────
    Uint8List? posterBytes;
    if (ticket.posterUrl.isNotEmpty) {
      try {
        final resp = await Dio().get<List<int>>(
          ticket.posterUrl,
          options: Options(responseType: ResponseType.bytes),
        );
        if (resp.data != null) {
          posterBytes = Uint8List.fromList(resp.data!);
        }
      } catch (_) {}
    }

    // ── 3. Build PDF — wallet-pass card layout ──────────────────────
    const double pageW = 520;
    const double pageH = 190;
    const double stubW = 150; // right QR stub width
    const double mainW = pageW - stubW;

    final qrImg = qrBytes != null ? pw.MemoryImage(qrBytes) : null;
    final posterImg =
        posterBytes != null ? pw.MemoryImage(posterBytes) : null;

    final statusLabel = ticket.isUsed
        ? 'USED'
        : ticket.isValid
            ? 'VALID'
            : ticket.status.toUpperCase();
    final statusColor =
        ticket.isValid && !ticket.isUsed ? PdfColors.green : PdfColors.red;

    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat(pageW, pageH, marginAll: 0),
        build: (pw.Context ctx) {
          return pw.Stack(
            children: [
              // ── Left background: event poster ─────────────────────
              pw.Positioned(
                left: 0,
                top: 0,
                right: stubW,
                bottom: 0,
                child: posterImg != null
                    ? pw.Image(posterImg, fit: pw.BoxFit.cover)
                    : pw.Container(
                        color: const PdfColor(0.1, 0.22, 0.45),
                      ),
              ),
              // ── Dark gradient overlay on left ─────────────────────
              pw.Positioned(
                left: 0,
                top: 0,
                right: stubW,
                bottom: 0,
                child: pw.Container(
                  // semi-transparent black overlay so text is readable
                  color: const PdfColor(0, 0, 0, 0.52),
                ),
              ),
              // ── Event details (bottom-left corner) ───────────────
              pw.Positioned(
                left: 14,
                bottom: 14,
                right: stubW + 10,
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  mainAxisSize: pw.MainAxisSize.min,
                  children: [
                    // Status + tier badges
                    pw.Row(
                      children: [
                        _pdfBadge(statusLabel, bg: statusColor),
                        if (ticket.tierName != null) ...[
                          pw.SizedBox(width: 5),
                          _pdfBadge(
                            ticket.tierName!,
                            bg: PdfColors.white,
                            fg: PdfColors.black,
                          ),
                        ],
                      ],
                    ),
                    pw.SizedBox(height: 5),
                    // Event title
                    pw.Text(
                      ticket.eventTitle ?? 'Event Ticket',
                      style: pw.TextStyle(
                        color: PdfColors.white,
                        fontSize: 18,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.SizedBox(height: 4),
                    // Date & venue
                    pw.Row(
                      children: [
                        if (ticket.startDate != null) ...[
                          pw.Text(
                            _formatDate(ticket.startDate!),
                            style: const pw.TextStyle(
                              color: PdfColors.white,
                              fontSize: 9,
                            ),
                          ),
                          if (ticket.venue != null)
                            pw.Padding(
                              padding: const pw.EdgeInsets.symmetric(
                                  horizontal: 5),
                              child: pw.Text(
                                '·',
                                style: const pw.TextStyle(
                                  color: PdfColors.grey,
                                  fontSize: 9,
                                ),
                              ),
                            ),
                        ],
                        if (ticket.venue != null)
                          pw.Text(
                            ticket.venue!,
                            style: const pw.TextStyle(
                              color: PdfColors.white,
                              fontSize: 9,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              // ── Right stub background ──────────────────────────────
              pw.Positioned(
                left: mainW,
                top: 0,
                right: 0,
                bottom: 0,
                child: pw.Container(color: const PdfColor(0.96, 0.96, 0.96)),
              ),
              // ── Right stub content: SCAN + QR + code ──────────────
              pw.Positioned(
                left: mainW,
                top: 0,
                right: 0,
                bottom: 0,
                child: pw.Column(
                  mainAxisAlignment: pw.MainAxisAlignment.center,
                  children: [
                    pw.Text(
                      'SCAN AT GATE',
                      style: pw.TextStyle(
                        fontSize: 6,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.grey600,
                        letterSpacing: 1,
                      ),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Container(
                      padding: const pw.EdgeInsets.all(5),
                      decoration: pw.BoxDecoration(
                        color: PdfColors.white,
                        border: pw.Border.all(
                            color: PdfColors.grey300, width: 0.5),
                        borderRadius: pw.BorderRadius.circular(6),
                      ),
                      child: qrImg != null
                          ? pw.Image(qrImg, width: 84, height: 84)
                          : pw.SizedBox(width: 84, height: 84),
                    ),
                    pw.SizedBox(height: 6),
                    pw.Text(
                      ticket.entryCode,
                      style: const pw.TextStyle(
                        fontSize: 7.5,
                        color: PdfColors.grey700,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );

    final dir = await getTemporaryDirectory();
    final safeName =
        ticket.entryCode.replaceAll(RegExp(r'[^A-Za-z0-9]'), '_');
    final file = File('${dir.path}/ticket_$safeName.pdf');
    await file.writeAsBytes(await pdf.save());
    return file;
  }

  /// Small coloured badge for the PDF ticket.
  static pw.Widget _pdfBadge(
    String label, {
    required PdfColor bg,
    PdfColor fg = PdfColors.white,
  }) {
    return pw.Container(
      padding:
          const pw.EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: pw.BoxDecoration(
        color: bg,
        borderRadius: pw.BorderRadius.circular(3),
      ),
      child: pw.Text(
        label,
        style: pw.TextStyle(
          color: fg,
          fontSize: 7,
          fontWeight: pw.FontWeight.bold,
        ),
      ),
    );
  }

  Future<void> _onShare() async {
    setState(() => _isBusy = true);
    try {
      final file = await _generatePdf();
      await Share.shareXFiles(
        [XFile(file.path, mimeType: 'application/pdf')],
        subject: 'Ticket — ${widget.ticket.eventTitle ?? "Event"}',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Could not share: $e'),
          backgroundColor: AppColors.error,
        ));
      }
    } finally {
      if (mounted) setState(() => _isBusy = false);
    }
  }

  Future<void> _onDownload() async {
    setState(() => _isBusy = true);
    try {
      final file = await _generatePdf();
      // Save to application documents directory
      final docsDir = await getApplicationDocumentsDirectory();
      final destPath = '${docsDir.path}/${file.uri.pathSegments.last}';
      final savedFile = await File(file.path).copy(destPath);
      // Also open share sheet so the user can save to Files / Downloads
      await Share.shareXFiles(
        [XFile(savedFile.path, mimeType: 'application/pdf')],
        subject: 'Ticket — ${widget.ticket.eventTitle ?? "Event"}',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Download failed: $e'),
          backgroundColor: AppColors.error,
        ));
      }
    } finally {
      if (mounted) setState(() => _isBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.of(context).padding.bottom;

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.all(Radius.circular(24)),
      ),
      child: Padding(
        padding:
            EdgeInsets.fromLTRB(22, 16, 22, bottomPad + 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 14),
            // Title
            Text(widget.ticket.eventTitle ?? 'Ticket',
                style: AppTextStyles.headlineSmall,
                textAlign: TextAlign.center),
            if ((widget.ticket.tierName ?? '').isNotEmpty) ...[
              const SizedBox(height: 3),
              Text(widget.ticket.tierName!,
                  style: AppTextStyles.bodyMedium),
            ],
            const SizedBox(height: 14),
            // QR image
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: TicketQrImage(
                ticketUuid: widget.ticket.uuid,
                authToken: widget.token,
                backendQrUrl: widget.ticket.backendQrUrl,
                size: 190,
              ),
            ),
            const SizedBox(height: 12),
            // Entry code
            Text(
              widget.ticket.entryCode,
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 16,
                fontWeight: FontWeight.w700,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 4),
            TextButton.icon(
              onPressed: () {
                Clipboard.setData(
                    ClipboardData(text: widget.ticket.entryCode));
                ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Entry code copied')));
              },
              icon: const Icon(Icons.copy_rounded, size: 14),
              label: const Text('Copy entry code'),
              style: TextButton.styleFrom(
                  visualDensity: VisualDensity.compact),
            ),
            const SizedBox(height: 10),
            // Download / Share row
            _isBusy
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 10),
                    child: CircularProgressIndicator(
                        color: AppColors.primary),
                  )
                : Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _onDownload,
                          icon: const Icon(
                              Icons.download_rounded,
                              size: 16),
                          label: const Text('Download'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.primary,
                            side: BorderSide(
                                color: AppColors.primary
                                    .withValues(alpha: 0.5)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _onShare,
                          icon: const Icon(Icons.share_rounded,
                              size: 16),
                          label: const Text('Share PDF'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
            const SizedBox(height: 8),
            const Text('Powered by Events & Votes',
                style: TextStyle(fontSize: 10, color: AppColors.textHint)),
          ],
        ),
      ),
    );
  }
}
