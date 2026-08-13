import 'package:flutter_test/flutter_test.dart';
import 'package:nofte_flutter/main.dart';

void main() {
  testWidgets('NoFTe app should load splash screen', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const NofteApp());

    // Verifikasi bahwa app title muncul
    expect(find.text('NoFTe'), findsWidgets);
  });
}
