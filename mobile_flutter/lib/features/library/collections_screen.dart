import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/colors.dart';

class CollectionsScreen extends StatefulWidget {
  const CollectionsScreen({super.key});

  @override
  State<CollectionsScreen> createState() => _CollectionsScreenState();
}

class _CollectionsScreenState extends State<CollectionsScreen> {
  List<Map<String, dynamic>> collections = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadCollections();
  }

  Future<void> _loadCollections() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      setState(() => loading = false);
      return;
    }

    try {
      final data = await Supabase.instance.client
          .from('collections')
          .select('*, collection_items(count)')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      setState(() {
        collections = List<Map<String, dynamic>>.from(data);
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  void _showCreateCollection() {
    final nameController = TextEditingController();
    final descController = TextEditingController();
    bool isPublic = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface1,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('New Collection', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textHigh)),
              const SizedBox(height: 20),
              TextField(
                controller: nameController,
                style: const TextStyle(color: AppColors.textHigh),
                decoration: _inputDecoration('Collection Name'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descController,
                style: const TextStyle(color: AppColors.textHigh),
                maxLines: 2,
                decoration: _inputDecoration('Description (optional)'),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Make Public', style: TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600)),
                  Switch(
                    value: isPublic,
                    onChanged: (v) => setModalState(() => isPublic = v),
                    activeColor: AppColors.accentPrimary,
                  ),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    if (nameController.text.isEmpty) return;
                    final user = Supabase.instance.client.auth.currentUser;
                    if (user == null) return;

                    HapticFeedback.mediumImpact();

                    try {
                      await Supabase.instance.client.from('collections').insert({
                        'user_id': user.id,
                        'name': nameController.text,
                        'description': descController.text,
                        'is_public': isPublic,
                      });
                      Navigator.pop(context);
                      _loadCollections();
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentPrimary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Create Collection', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: AppColors.textLow),
      filled: true,
      fillColor: AppColors.bgCanvas,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('My Collections', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateCollection,
        backgroundColor: AppColors.accentPrimary,
        child: const Icon(Icons.add),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : collections.isEmpty
              ? _buildEmptyState()
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.85,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: collections.length,
                  itemBuilder: (context, index) => _buildCollectionCard(collections[index]),
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.surface1,
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Icon(Icons.collections_bookmark, size: 48, color: AppColors.textLow),
          ),
          const SizedBox(height: 20),
          const Text('No collections yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textHigh)),
          const SizedBox(height: 8),
          const Text('Create one to organize your books!', style: TextStyle(color: AppColors.textMed)),
        ],
      ),
    );
  }

  Widget _buildCollectionCard(Map<String, dynamic> collection) {
    final itemCount = collection['collection_items']?[0]?['count'] ?? 0;
    final isPublic = collection['is_public'] == true;

    return GestureDetector(
      onTap: () {},
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface1,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.surface2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover
            Container(
              height: 100,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.accentPrimary.withOpacity(0.3), AppColors.accentBlue.withOpacity(0.2)],
                ),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: const Center(
                child: Icon(Icons.collections_bookmark, color: AppColors.accentPrimary, size: 40),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          collection['name'] ?? 'Untitled',
                          style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w700, fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isPublic)
                        const Icon(Icons.public, color: AppColors.textLow, size: 16),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text('$itemCount books', style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
