import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/services/tickets_service.dart';
import '../../core/theme/app_theme.dart';

/// Renders the ticket's signed payload as a PNG the PDF pass can embed.
Future<Uint8List?> renderTicketQrPng(String data, {double size = 300}) async {
  final painter = QrPainter(
    data: data,
    version: QrVersions.auto,
    gapless: true,
    eyeStyle: const QrEyeStyle(
      eyeShape: QrEyeShape.square,
      color: Color(0xFF111111),
    ),
    dataModuleStyle: const QrDataModuleStyle(
      dataModuleShape: QrDataModuleShape.square,
      color: Color(0xFF111111),
    ),
  );
  final bytes = await painter.toImageData(size, format: ui.ImageByteFormat.png);
  return bytes?.buffer.asUint8List();
}

/// Displays a ticket QR code fetched from the backend API.
class TicketQrImage extends StatefulWidget {
  final String ticketUuid;
  final String? authToken;
  final String? backendQrUrl;
  final String? qrData;
  final double size;
  final BoxFit fit;

  const TicketQrImage({
    super.key,
    required this.ticketUuid,
    this.authToken,
    this.backendQrUrl,
    this.qrData,
    this.size = 190,
    this.fit = BoxFit.contain,
  });

  @override
  State<TicketQrImage> createState() => _TicketQrImageState();
}

class _TicketQrImageState extends State<TicketQrImage> {
  final _service = TicketsService();
  Uint8List? _bytes;
  bool _loading = true;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant TicketQrImage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.ticketUuid != widget.ticketUuid ||
        oldWidget.authToken != widget.authToken ||
        oldWidget.backendQrUrl != widget.backendQrUrl ||
        oldWidget.qrData != widget.qrData ||
        oldWidget.size != widget.size) {
      _load();
    }
  }

  String? get _payload {
    final value = widget.qrData?.trim();
    if (value == null || value.isEmpty) return null;
    return value;
  }

  Future<void> _load() async {
    if (_payload != null) {
      if (mounted) {
        setState(() {
          _loading = false;
          _failed = false;
          _bytes = null;
        });
      }
      return;
    }

    if (widget.authToken == null) {
      if (mounted) {
        setState(() {
          _loading = false;
          _failed = true;
          _bytes = null;
        });
      }
      return;
    }

    setState(() {
      _loading = true;
      _failed = false;
      _bytes = null;
    });

    try {
      final size = widget.size.round();
      Uint8List? bytes;

      final backendUrl = widget.backendQrUrl?.trim();
      if (backendUrl != null && backendUrl.isNotEmpty) {
        bytes = await _service.getQrImageBytesFromUrl(
          backendUrl,
          size: size,
        );
      }

      bytes ??= await _service.getQrImageBytes(
        widget.ticketUuid,
        size: size,
      );

      if (!mounted) return;
      setState(() {
        _bytes = bytes;
        _failed = bytes == null;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _failed = true;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return SizedBox(
        width: widget.size,
        height: widget.size,
        child: const Center(
          child: SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }

    final payload = _payload;
    if (payload != null) {
      return QrImageView(
        data: payload,
        version: QrVersions.auto,
        size: widget.size,
        backgroundColor: Colors.white,
        padding: EdgeInsets.all(widget.size * 0.06),
        eyeStyle: const QrEyeStyle(
          eyeShape: QrEyeShape.square,
          color: Color(0xFF111111),
        ),
        dataModuleStyle: const QrDataModuleStyle(
          dataModuleShape: QrDataModuleShape.square,
          color: Color(0xFF111111),
        ),
      );
    }

    if (_failed || _bytes == null) {
      return SizedBox(
        width: widget.size,
        height: widget.size,
        child: IconButton(
          onPressed: _load,
          icon: const Icon(
            Icons.qr_code_2_rounded,
            color: AppColors.textHint,
          ),
          tooltip: 'Retry loading QR code',
        ),
      );
    }

    return Image.memory(
      _bytes!,
      width: widget.size,
      height: widget.size,
      fit: widget.fit,
      gaplessPlayback: true,
    );
  }
}
