import 'dart:async';
import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Gaka - Fully Autonomous Voice Assistant for TomeSphere
/// Features:
/// - Wake word detection ("Hey Gaka")
/// - Continuous listening mode
/// - Natural language understanding
/// - Autonomous navigation and actions
/// - Database queries via Supabase
/// - Text-to-speech responses

class GakaVoiceAssistant {
  static final GakaVoiceAssistant _instance = GakaVoiceAssistant._internal();
  factory GakaVoiceAssistant() => _instance;
  GakaVoiceAssistant._internal();

  final SpeechToText _speech = SpeechToText();
  final FlutterTts _tts = FlutterTts();
  
  // State
  bool _isInitialized = false;
  bool _isListening = false;
  bool _isAwake = false;
  bool _isProcessing = false;
  String _lastTranscript = '';
  
  // Callbacks
  Function(GakaState)? onStateChanged;
  Function(String)? onTranscriptChanged;
  Function(String)? onResponseGenerated;
  
  // Router context for navigation
  BuildContext? _routerContext;
  
  // Wake words
  final List<String> _wakeWords = ['hey gaka', 'hey data', 'hi gaka', 'okay gaka'];
  
  // Silence timer
  Timer? _silenceTimer;
  
  GakaState get state {
    if (_isProcessing) return GakaState.processing;
    if (_isAwake) return GakaState.listening;
    if (_isListening) return GakaState.idle;
    return GakaState.off;
  }

  Future<bool> initialize() async {
    if (_isInitialized) return true;
    
    try {
      _isInitialized = await _speech.initialize(
        onStatus: _onSpeechStatus,
        onError: (error) => debugPrint('Speech error: $error'),
      );

      await _tts.setLanguage('en-US');
      await _tts.setSpeechRate(0.55);
      await _tts.setVolume(1.0);
      await _tts.setPitch(1.0);
      
      return _isInitialized;
    } catch (e) {
      debugPrint('Gaka init error: $e');
      return false;
    }
  }

  void _onSpeechStatus(String status) {
    _isListening = status == 'listening';
    if (status == 'done' || status == 'notListening') {
      // Auto-restart listening
      Future.delayed(const Duration(milliseconds: 100), () {
        if (!_isProcessing) _startContinuousListening();
      });
    }
  }

  /// Start continuous listening mode (always on)
  Future<void> startContinuousListening() async {
    if (!_isInitialized) await initialize();
    _startContinuousListening();
  }

  Future<void> _startContinuousListening() async {
    if (_isProcessing) return;
    
    try {
      await _speech.listen(
        onResult: _onSpeechResult,
        listenFor: const Duration(seconds: 30),
        pauseFor: const Duration(seconds: 3),
        partialResults: true,
        cancelOnError: false,
      );
      _isListening = true;
      onStateChanged?.call(state);
    } catch (e) {
      debugPrint('Listen error: $e');
    }
  }

  void _onSpeechResult(result) {
    final transcript = result.recognizedWords.toLowerCase().trim();
    _lastTranscript = transcript;
    onTranscriptChanged?.call(transcript);
    
    if (!_isAwake) {
      // Check for wake word
      for (final wake in _wakeWords) {
        if (transcript.contains(wake)) {
          _activate();
          return;
        }
      }
    } else {
      // We're awake - process command after silence
      _silenceTimer?.cancel();
      
      if (result.finalResult) {
        _processCommand(transcript);
      } else {
        // Wait for silence before processing
        _silenceTimer = Timer(const Duration(milliseconds: 1200), () {
          _processCommand(transcript);
        });
      }
    }
  }

  void _activate() {
    _isAwake = true;
    _isProcessing = false;
    onStateChanged?.call(GakaState.listening);
    speak("Yes?");
    
    // Auto-deactivate after 10 seconds of silence
    _silenceTimer?.cancel();
    _silenceTimer = Timer(const Duration(seconds: 10), _deactivate);
  }

  void _deactivate() {
    _isAwake = false;
    _isProcessing = false;
    _lastTranscript = '';
    onStateChanged?.call(GakaState.idle);
  }

  Future<void> _processCommand(String command) async {
    if (_isProcessing || command.isEmpty) return;
    
    _isProcessing = true;
    _silenceTimer?.cancel();
    onStateChanged?.call(GakaState.processing);
    
    // Remove wake word from command
    String cleanCommand = command;
    for (final wake in _wakeWords) {
      cleanCommand = cleanCommand.replaceAll(wake, '').trim();
    }
    
    debugPrint('[Gaka] Processing: $cleanCommand');
    
    try {
      await _executeCommand(cleanCommand);
    } catch (e) {
      debugPrint('Command error: $e');
      speak("Sorry, I encountered an error.");
    }
    
    // Reset after processing
    Future.delayed(const Duration(seconds: 2), _deactivate);
  }

  Future<void> _executeCommand(String command) async {
    // ===== NAVIGATION COMMANDS =====
    if (_matchesIntent(command, ['go to', 'open', 'show me', 'navigate to'])) {
      if (_matchesTarget(command, ['home', 'dashboard', 'main'])) {
        await _navigate('/', 'Opening home');
      } else if (_matchesTarget(command, ['explore', 'search', 'browse', 'discover'])) {
        await _navigate('/explore', 'Opening explore');
      } else if (_matchesTarget(command, ['library', 'my books', 'books', 'collection'])) {
        await _navigate('/library', 'Opening your library');
      } else if (_matchesTarget(command, ['academics', 'study', 'school', 'education'])) {
        await _navigate('/academics', 'Opening academics');
      } else if (_matchesTarget(command, ['profile', 'settings', 'account', 'me'])) {
        await _navigate('/profile', 'Opening profile');
      } else {
        speak("I'm not sure where to go. Try saying go to home, library, or explore.");
      }
    }
    // ===== SEARCH COMMANDS =====
    else if (_matchesIntent(command, ['search for', 'find', 'look for', 'search'])) {
      final query = _extractSearchQuery(command);
      if (query.isNotEmpty) {
        await _searchBooks(query);
      } else {
        speak("What would you like me to search for?");
      }
    }
    // ===== READING STATUS =====
    else if (_matchesIntent(command, ['what am i reading', 'currently reading', 'reading list', 'my current book'])) {
      await _getCurrentlyReading();
    }
    // ===== STATS =====
    else if (_matchesIntent(command, ['how many books', 'my stats', 'reading stats', 'book count'])) {
      await _getReadingStats();
    }
    // ===== HELP =====
    else if (_matchesIntent(command, ['help', 'what can you do', 'commands', 'how to use'])) {
      speak("I'm Gaka, your reading assistant. I can navigate the app, search for books, check your reading list, and more. Try saying go to library, or search for a book title.");
    }
    // ===== GREETINGS =====
    else if (_matchesIntent(command, ['hello', 'hi', 'hey', 'good morning', 'good evening'])) {
      speak("Hello! How can I help you with your reading today?");
    }
    // ===== STOP =====
    else if (_matchesIntent(command, ['stop', 'cancel', 'never mind', 'dismiss', 'bye'])) {
      speak("Okay, let me know if you need anything.");
      _deactivate();
    }
    // ===== UNKNOWN =====
    else {
      speak("I didn't catch that. Try saying go to library, search for a book, or help.");
    }
  }

  bool _matchesIntent(String command, List<String> intents) {
    for (final intent in intents) {
      if (command.contains(intent)) return true;
    }
    return false;
  }

  bool _matchesTarget(String command, List<String> targets) {
    for (final target in targets) {
      if (command.contains(target)) return true;
    }
    return false;
  }

  String _extractSearchQuery(String command) {
    final patterns = ['search for', 'find book', 'look for', 'search', 'find'];
    String query = command;
    for (final pattern in patterns) {
      query = query.replaceFirst(pattern, '').trim();
    }
    return query;
  }

  Future<void> _navigate(String path, String response) async {
    speak(response);
    if (_routerContext != null) {
      _routerContext!.go(path);
    }
  }

  Future<void> _searchBooks(String query) async {
    speak("Searching for $query");
    
    try {
      final data = await Supabase.instance.client
          .from('books')
          .select('title, author')
          .ilike('title', '%$query%')
          .limit(3);
      
      if (data.isNotEmpty) {
        final count = data.length;
        final firstBook = data[0]['title'];
        speak("I found $count books. The first one is $firstBook.");
        
        // Navigate to explore with search
        if (_routerContext != null) {
          _routerContext!.go('/explore');
        }
      } else {
        speak("I couldn't find any books matching $query. Try a different search.");
      }
    } catch (e) {
      speak("I had trouble searching. Please try again.");
    }
  }

  Future<void> _getCurrentlyReading() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      speak("Please sign in to see your reading list.");
      return;
    }

    try {
      final data = await Supabase.instance.client
          .from('reading_lists')
          .select('books(title)')
          .eq('user_id', user.id)
          .eq('status', 'currently_reading')
          .limit(3);
      
      if (data.isNotEmpty) {
        final count = data.length;
        final bookTitle = data[0]['books']?['title'] ?? 'a book';
        speak("You're currently reading $count books. Including $bookTitle.");
      } else {
        speak("You're not currently reading any books. Would you like to explore some?");
      }
    } catch (e) {
      speak("I couldn't check your reading list.");
    }
  }

  Future<void> _getReadingStats() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      speak("Please sign in to see your stats.");
      return;
    }

    try {
      final data = await Supabase.instance.client
          .from('reading_lists')
          .select('status')
          .eq('user_id', user.id);
      
      final total = data.length;
      final finished = data.where((d) => d['status'] == 'finished').length;
      final reading = data.where((d) => d['status'] == 'currently_reading').length;
      
      speak("You have $total books in your library. $finished finished, and $reading currently reading.");
    } catch (e) {
      speak("I couldn't get your stats.");
    }
  }

  Future<void> speak(String text) async {
    onResponseGenerated?.call(text);
    await _tts.speak(text);
  }

  void setRouterContext(BuildContext context) {
    _routerContext = context;
  }

  void stop() {
    _speech.stop();
    _tts.stop();
    _silenceTimer?.cancel();
    _isListening = false;
    _isAwake = false;
    _isProcessing = false;
  }

  void dispose() {
    stop();
  }
}

enum GakaState {
  off,       // Not listening
  idle,      // Listening for wake word
  listening, // Awake and listening for command
  processing // Processing command
}
