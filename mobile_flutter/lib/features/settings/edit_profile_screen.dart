import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _bioController = TextEditingController();
  bool loading = true;
  bool saving = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      setState(() => loading = false);
      return;
    }

    try {
      final data = await Supabase.instance.client
          .from('profiles')
          .select()
          .eq('id', user.id)
          .single();

      _nameController.text = data['full_name'] ?? '';
      _bioController.text = data['bio'] ?? '';
    } catch (e) {
      debugPrint('Error: $e');
    }

    setState(() => loading = false);
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    setState(() => saving = true);
    HapticFeedback.mediumImpact();

    try {
      await Supabase.instance.client.from('profiles').update({
        'full_name': _nameController.text.trim(),
        'bio': _bioController.text.trim(),
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', user.id);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated!'), backgroundColor: AppColors.accentSecondary),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
      );
    }

    setState(() => saving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Edit Profile', style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          TextButton(
            onPressed: saving ? null : _saveProfile,
            child: saving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accentPrimary))
                : const Text('Save', style: TextStyle(color: AppColors.accentPrimary, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Avatar placeholder
                    Center(
                      child: Stack(
                        children: [
                          Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              color: AppColors.accentPrimary.withOpacity(0.2),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.person, size: 50, color: AppColors.accentPrimary),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: const BoxDecoration(
                                color: AppColors.accentPrimary,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.camera_alt, size: 18, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Name field
                    _buildLabel('Full Name'),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _nameController,
                      style: const TextStyle(color: AppColors.textHigh),
                      decoration: _inputDecoration('Enter your full name'),
                      validator: (v) => v!.isEmpty ? 'Name is required' : null,
                    ),
                    const SizedBox(height: 24),

                    // Bio field
                    _buildLabel('Bio'),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _bioController,
                      style: const TextStyle(color: AppColors.textHigh),
                      maxLines: 4,
                      decoration: _inputDecoration('Tell us about yourself...'),
                    ),
                    const SizedBox(height: 32),

                    // Email (read-only)
                    _buildLabel('Email'),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surface1,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.surface2),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.email, color: AppColors.textMed, size: 20),
                          const SizedBox(width: 12),
                          Text(
                            Supabase.instance.client.auth.currentUser?.email ?? 'Not set',
                            style: const TextStyle(color: AppColors.textMed),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: AppColors.textMed,
        fontWeight: FontWeight.w600,
        fontSize: 14,
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: AppColors.textLow),
      filled: true,
      fillColor: AppColors.surface1,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.surface2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.accentPrimary, width: 2),
      ),
    );
  }
}
