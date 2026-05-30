import 'payment_url_utils.dart';

/// HTML that opens Paystack inline checkout (same as web PaystackPop).
String buildPaystackInlineHtml(PaystackInlineConfig config) {
  final email = _escapeJs(config.email);
  final key = _escapeJs(config.publicKey);
  final ref = _escapeJs(config.reference);

  return '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Pay with Paystack</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #f5f7fb; margin: 0; padding: 24px; text-align: center; }
    p { color: #555; font-size: 14px; }
  </style>
</head>
<body>
  <p>Opening Paystack secure checkout…</p>
  <script src="https://js.paystack.co/v1/inline.js"></script>
  <script>
    function openPaystack() {
      try {
        var handler = PaystackPop.setup({
          key: '$key',
          email: '$email',
          amount: ${config.amountKobo},
          currency: 'NGN',
          ref: '$ref',
          callback: function(response) {
            window.location.href = 'evote://payment/success?reference=' +
              encodeURIComponent(response.reference || '$ref');
          },
          onClose: function() {
            window.location.href = 'evote://payment/cancel';
          }
        });
        handler.openIframe();
      } catch (e) {
        document.body.innerHTML = '<p style="color:red">Could not open Paystack: ' + e + '</p>';
      }
    }
    if (document.readyState === 'complete') openPaystack();
    else window.addEventListener('load', openPaystack);
  </script>
</body>
</html>
''';
}

String _escapeJs(String value) =>
    value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
