import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../../core/services/cart_service.dart';
import '../../../core/services/tickets_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/paystack_inline_html.dart';
import '../../../core/utils/payment_url_utils.dart';

class PaymentWebViewScreen extends StatefulWidget {
  final String? paymentUrl;
  final String? inlineHtml;
  final String reference;
  final String type;

  const PaymentWebViewScreen({
    super.key,
    this.paymentUrl,
    this.inlineHtml,
    required this.reference,
    this.type = 'tickets',
  }) : assert(paymentUrl != null || inlineHtml != null);

  factory PaymentWebViewScreen.fromUrl({
    required String paymentUrl,
    required String reference,
    String type = 'tickets',
  }) {
    return PaymentWebViewScreen(
      paymentUrl: paymentUrl,
      reference: reference,
      type: type,
    );
  }

  factory PaymentWebViewScreen.fromPaystackInline({
    required PaystackInlineConfig config,
    required String reference,
    String type = 'tickets',
  }) {
    return PaymentWebViewScreen(
      inlineHtml: buildPaystackInlineHtml(config),
      reference: reference,
      type: type,
    );
  }

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  late final WebViewController _controller;
  bool _verifying = false;
  bool _pageLoaded = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _pageLoaded = false);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _pageLoaded = true);
          },
          onNavigationRequest: (request) {
            final url = request.url;
            if (_shouldHandlePaymentReturn(url)) {
              _handleCallback(url);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
          onUrlChange: (change) {
            final url = change.url;
            if (url != null && _shouldHandlePaymentReturn(url)) {
              _handleCallback(url);
            }
          },
        ),
      );

    final html = widget.inlineHtml;
    if (html != null) {
      _controller.loadHtmlString(html, baseUrl: 'https://paystack.com');
    } else {
      _controller.loadRequest(Uri.parse(widget.paymentUrl!));
    }
  }

  bool _shouldHandlePaymentReturn(String url) {
    if (url.startsWith('evote://payment/')) return true;
    if (url.contains('payment/callback')) return true;
    if (url.contains('reference=') || url.contains('trxref=')) {
      return url.contains('callback') ||
          url.contains('bizinvestify.com') ||
          url.contains('paystack');
    }
    return false;
  }

  Future<void> _handleCallback(String url) async {
    if (_verifying) return;
    setState(() => _verifying = true);

    if (url.contains('evote://payment/cancel')) {
      if (mounted) Navigator.of(context, rootNavigator: true).pop(false);
      return;
    }

    final uri = Uri.tryParse(url);
    final reference = uri?.queryParameters['reference'] ??
        uri?.queryParameters['trxref'] ??
        widget.reference;

    try {
      if (widget.type == 'cart') {
        await CartService().checkoutCallback(reference: reference);
      } else {
        await TicketsService().paymentCallback(reference: reference);
      }
      if (mounted) Navigator.of(context, rootNavigator: true).pop(true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error,
          ),
        );
        Navigator.of(context, rootNavigator: true).pop(false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Paystack Checkout'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (!_pageLoaded && !_verifying)
            const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: AppColors.primary),
                  SizedBox(height: 12),
                  Text(
                    'Loading Paystack…',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          if (_verifying)
            Container(
              color: Colors.black26,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: AppColors.primary),
                    SizedBox(height: 12),
                    Text(
                      'Confirming payment…',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
