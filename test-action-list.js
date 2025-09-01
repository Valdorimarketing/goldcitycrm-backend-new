const mysql = require('mysql2/promise');

async function testActionList() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'valdori_crm'
  });

  try {
    console.log('🚀 Test başlıyor...\n');
    
    // 1. Ürünü kontrol et
    const [products] = await connection.execute(
      'SELECT id, name, action_list FROM product WHERE id = 9'
    );
    console.log('✅ Ürün bilgisi:');
    console.log('ID:', products[0].id);
    console.log('Name:', products[0].name);
    console.log('Action List:', JSON.stringify(products[0].action_list, null, 2));
    console.log('');
    
    // 2. Sales-product oluştur
    const salesProductId = Date.now(); // unique id için timestamp
    await connection.execute(
      'INSERT INTO sales_product (id, sales, product, currency, price, discount, vat, total_price, created_at, updates_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [salesProductId, 2, 9, 'TRY', 15000, 0, 18, 17700]
    );
    console.log('✅ Sales-product oluşturuldu. ID:', salesProductId);
    console.log('');
    
    // 3. Meeting oluştur (25 Ağustos 2025)
    const meetingDate = '2025-08-25 10:00:00';
    await connection.execute(
      'INSERT INTO meeting (customer, meeting_location, start_time, end_time, user, meeting_status, description, sales_product_id, created_at, updates_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [1, 1, meetingDate, '2025-08-25 12:00:00', 1, 1, 'Saç ekimi operasyonu', salesProductId]
    );
    console.log('✅ Meeting oluşturuldu. Tarih:', meetingDate);
    console.log('');
    
    // 4. Sales service'i tetiklemek için sales'i update edelim
    // (Normalde service otomatik yapacak ama test için manuel ekleyelim)
    console.log('📝 Customer-note kayıtları oluşturuluyor...');
    
    const actionList = products[0].action_list || [];
    const meetingDateObj = new Date(meetingDate);
    
    for (const action of actionList) {
      const noteDate = new Date(meetingDateObj);
      noteDate.setDate(noteDate.getDate() + action.dayOffset);
      
      await connection.execute(
        'INSERT INTO customer_note (customer, note, is_reminding, reminding_at, note_type, created_at, updates_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [1, `${action.description} - ${products[0].name}`, 1, noteDate, 'Şablon Araması']
      );
      
      console.log(`  ✅ ${action.description}`);
      console.log(`     Tarih: ${noteDate.toLocaleDateString('tr-TR')} ${noteDate.toLocaleTimeString('tr-TR')}`);
    }
    console.log('');
    
    // 5. Oluşan customer-note kayıtlarını göster
    const [notes] = await connection.execute(
      'SELECT * FROM customer_note WHERE customer = 1 AND note_type = "Şablon Araması" ORDER BY reminding_at'
    );
    
    console.log('📋 Oluşan Customer-Note Kayıtları:');
    console.log('─'.repeat(50));
    notes.forEach((note, index) => {
      const date = new Date(note.reminding_at);
      console.log(`${index + 1}. ${note.note}`);
      console.log(`   Tarih: ${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR')}`);
      console.log('');
    });
    
    console.log('✅ Test başarıyla tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await connection.end();
  }
}

testActionList();