import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'app/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Supabase.initialize(
    url: 'https://qusuvzwycdmnecixzsgc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1c3V2end5Y2RtbmVjaXh6c2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMTY0MDAsImV4cCI6MjA3OTg5MjQwMH0.rrTm1dBtPoIHphAdP6HdJKZGUoUbD17Hmn7G1sM9o1Q',
  );

  runApp(
    const ProviderScope(
      child: TomeSphereApp(),
    ),
  );
}
