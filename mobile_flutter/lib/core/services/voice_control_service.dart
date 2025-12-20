import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:go_router/go_router.dart';

class VoiceControlService {
  static final VoiceControlService _instance = VoiceControlService._internal();
  factory VoiceControlService() => _instance;
  VoiceControlService._internal();

  final SpeechToText _speech = SpeechToText();
  final FlutterTts _tts = FlutterTts();
  
  bool _isInitialized = false;
  bool _isListening = false;
  String _lastCommand = '';
  Function(String)? onCommandReceived;
  Function(bool)? onListeningChanged;

  bool get isListening => _isListening;
  String get lastCommand => _lastCommand;

  Future<bool> initialize() async {
    if (_isInitialized) return true;
    
    try {
      _isInitialized = await _speech.initialize(
        onStatus: (status) {
          _isListening = status == 'listening';
          onListeningChanged?.call(_isListening);
        },
        onError: (error) {
          debugPrint('Speech error: $error');
          _isListening = false;
          onListeningChanged?.call(false);
        },
      );

      await _tts.setLanguage('en-US');
      await _tts.setSpeechRate(0.5);
      await _tts.setVolume(1.0);
      
      return _isInitialized;
    } catch (e) {
      debugPrint('Voice init error: $e');
      return false;
    }
  }

  Future<void> startListening() async {
    if (!_isInitialized) {
      await initialize();
    }

    if (_speech.isAvailable && !_isListening) {
      _isListening = true;
      onListeningChanged?.call(true);
      
      await _speech.listen(
        onResult: (result) {
          if (result.finalResult) {
            _lastCommand = result.recognizedWords.toLowerCase();
            onCommandReceived?.call(_lastCommand);
            processCommand(_lastCommand);
          }
        },
        listenFor: const Duration(seconds: 10),
        pauseFor: const Duration(seconds: 3),
      );
    }
  }

  Future<void> stopListening() async {
    if (_isListening) {
      await _speech.stop();
      _isListening = false;
      onListeningChanged?.call(false);
    }
  }

  Future<void> speak(String text) async {
    await _tts.speak(text);
  }

  void processCommand(String command, [BuildContext? context]) {
    // Navigation commands
    if (command.contains('go to home') || command.contains('open home')) {
      _navigate('/');
      speak('Opening home screen');
    } 
    else if (command.contains('go to explore') || command.contains('search books')) {
      _navigate('/explore');
      speak('Opening explore screen');
    }
    else if (command.contains('go to library') || command.contains('my books') || command.contains('open library')) {
      _navigate('/library');
      speak('Opening your library');
    }
    else if (command.contains('go to academics') || command.contains('study')) {
      _navigate('/academics');
      speak('Opening academics');
    }
    else if (command.contains('go to profile') || command.contains('my profile') || command.contains('settings')) {
      _navigate('/profile');
      speak('Opening profile');
    }
    // Search commands
    else if (command.startsWith('search for') || command.startsWith('find book')) {
      final query = command.replaceFirst(RegExp(r'^(search for|find book)\s*'), '');
      speak('Searching for $query');
    }
    // Reading commands
    else if (command.contains('what am i reading') || command.contains('currently reading')) {
      speak('Checking your reading list');
      _navigate('/library');
    }
    // Help
    else if (command.contains('help') || command.contains('what can you do')) {
      speak('I can help you navigate. Say go to home, explore, library, academics, or profile.');
    }
    else {
      speak("I didn't understand. Try saying go to home, library, or search for a book.");
    }
  }

  BuildContext? _routerContext;
  
  void setRouterContext(BuildContext context) {
    _routerContext = context;
  }

  void _navigate(String path) {
    if (_routerContext != null) {
      _routerContext!.go(path);
    }
  }

  void dispose() {
    _speech.cancel();
    _tts.stop();
  }
}
