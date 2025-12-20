import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/colors.dart';

class TextbookExchangeScreen extends StatefulWidget {
  const TextbookExchangeScreen({super.key});

  @override
  State<TextbookExchangeScreen> createState() => _TextbookExchangeScreenState();
}

class _TextbookExchangeScreenState extends State<TextbookExchangeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> listings = [];
  List<Map<String, dynamic>> myListings = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadListings();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadListings() async {
    try {
      final data = await Supabase.instance.client
          .from('textbook_listings')
          .select('*, profiles(full_name)')
          .eq('status', 'available')
          .order('created_at', ascending: false);

      final user = Supabase.instance.client.auth.currentUser;
      List<Map<String, dynamic>> mine = [];
      
      if (user != null) {
        mine = data.where((l) => l['seller_id'] == user.id).toList().cast<Map<String, dynamic>>();
      }

      setState(() {
        listings = List<Map<String, dynamic>>.from(data);
        myListings = mine;
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  void _showCreateListing() {
    final titleController = TextEditingController();
    final priceController = TextEditingController();
    final descController = TextEditingController();
    String condition = 'Good';

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
              const Text('List Textbook', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textHigh)),
              const SizedBox(height: 20),
              TextField(
                controller: titleController,
                style: const TextStyle(color: AppColors.textHigh),
                decoration: _inputDecoration('Textbook Title'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: priceController,
                style: const TextStyle(color: AppColors.textHigh),
                keyboardType: TextInputType.number,
                decoration: _inputDecoration('Price (₹)'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descController,
                style: const TextStyle(color: AppColors.textHigh),
                maxLines: 2,
                decoration: _inputDecoration('Description (optional)'),
              ),
              const SizedBox(height: 16),
              const Text('Condition', style: TextStyle(color: AppColors.textMed, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: ['New', 'Like New', 'Good', 'Fair'].map((c) {
                  final isSelected = condition == c;
                  return GestureDetector(
                    onTap: () => setModalState(() => condition = c),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.accentPrimary : AppColors.bgCanvas,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: isSelected ? AppColors.accentPrimary : AppColors.surface2),
                      ),
                      child: Text(c, style: TextStyle(color: isSelected ? Colors.white : AppColors.textMed, fontWeight: FontWeight.w600)),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    if (titleController.text.isEmpty || priceController.text.isEmpty) return;
                    
                    final user = Supabase.instance.client.auth.currentUser;
                    if (user == null) return;

                    HapticFeedback.mediumImpact();

                    try {
                      await Supabase.instance.client.from('textbook_listings').insert({
                        'seller_id': user.id,
                        'title': titleController.text,
                        'price': double.tryParse(priceController.text) ?? 0,
                        'description': descController.text,
                        'condition': condition,
                        'status': 'available',
                      });
                      Navigator.pop(context);
                      _loadListings();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Listing created!'), backgroundColor: AppColors.accentSecondary),
                      );
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
                  child: const Text('Create Listing', style: TextStyle(fontWeight: FontWeight.w700)),
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
        title: const Text('Textbook Exchange', style: TextStyle(fontWeight: FontWeight.w800)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.accentPrimary,
          labelColor: AppColors.accentPrimary,
          unselectedLabelColor: AppColors.textMed,
          tabs: const [
            Tab(text: 'Browse'),
            Tab(text: 'My Listings'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateListing,
        backgroundColor: AppColors.accentPrimary,
        child: const Icon(Icons.add),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildListingsGrid(listings),
                _buildListingsGrid(myListings),
              ],
            ),
    );
  }

  Widget _buildListingsGrid(List<Map<String, dynamic>> items) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.menu_book, size: 48, color: AppColors.textLow),
            const SizedBox(height: 16),
            const Text('No textbooks listed', style: TextStyle(color: AppColors.textMed)),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.75,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) => _buildListingCard(items[index]),
    );
  }

  Widget _buildListingCard(Map<String, dynamic> listing) {
    final price = listing['price'] ?? 0;
    final condition = listing['condition'] ?? 'Good';
    final sellerName = listing['profiles']?['full_name'] ?? 'Unknown';

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.surface2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image placeholder
          Container(
            height: 100,
            decoration: BoxDecoration(
              color: AppColors.accentPrimary.withOpacity(0.1),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: const Center(child: Icon(Icons.menu_book, size: 40, color: AppColors.accentPrimary)),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  listing['title'] ?? 'Untitled',
                  style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w700, fontSize: 13),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text('by $sellerName', style: const TextStyle(color: AppColors.textMed, fontSize: 11)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('₹$price', style: const TextStyle(color: AppColors.accentSecondary, fontWeight: FontWeight.w800, fontSize: 16)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.accentOrange.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(condition, style: const TextStyle(color: AppColors.accentOrange, fontSize: 10, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
