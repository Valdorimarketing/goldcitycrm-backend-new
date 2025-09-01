# Valdori CRM API

NestJS, TypeORM ve MySQL kullanılarak geliştirilmiş CRM (Customer Relationship Management) sistemi API'si.

## Özellikler

- **Modern Mimari**: NestJS framework ile temiz ve ölçeklenebilir mimari
- **TypeORM**: Güçlü ORM desteği ile veritabanı işlemleri
- **MySQL**: Güvenilir veritabanı çözümü
- **Base Classes**: Tekrar kullanılabilir base entity, repository ve service sınıfları
- **DTO Validation**: class-validator ile güçlü validasyon desteği
- **Modüler Yapı**: Her entity için ayrı modül organizasyonu

## Kurulum

1. Projeyi klonlayın:
```bash
git clone <repository-url>
cd valdoriCrmApi
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Environment dosyasını düzenleyin:
```bash
cp .env.example .env
```

4. Veritabanı ayarlarını `.env` dosyasında yapılandırın:
```
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=valdori_crm
```

5. Uygulamayı başlatın:
```bash
npm run start:dev
```

## Proje Yapısı

```
src/
├── core/                   # Temel sınıflar ve utilities
│   ├── base/              # Base entity, repository, service
│   ├── decorators/        # Custom decorators
│   ├── utils/            # Utility fonksiyonlar
│   └── config/           # Konfigürasyon dosyaları
├── modules/              # İş modülleri
│   ├── user/            # Kullanıcı modülü
│   ├── customer/        # Müşteri modülü
│   ├── role/           # Rol modülü
│   └── ...             # Diğer modüller
└── app.module.ts       # Ana modül
```

## Modül Yapısı

Her modül şu yapıya sahiptir:
```
module-name/
├── entities/           # TypeORM entity'leri
├── dto/               # Data Transfer Objects
├── repositories/      # Repository sınıfları
├── services/         # Business logic
├── controllers/      # HTTP controllers
└── module.module.ts  # Modül tanımı
```

## API Endpoints

### Users
- `GET /users` - Tüm kullanıcıları listele
- `GET /users/:id` - Kullanıcı detayı
- `POST /users` - Yeni kullanıcı oluştur
- `PATCH /users/:id` - Kullanıcı güncelle
- `DELETE /users/:id` - Kullanıcı sil

### Customers
- `GET /customers` - Tüm müşterileri listele
- `GET /customers/:id` - Müşteri detayı
- `POST /customers` - Yeni müşteri oluştur
- `PATCH /customers/:id` - Müşteri güncelle
- `DELETE /customers/:id` - Müşteri sil

## Veritabanı Yapısı

Proje aşağıdaki ana tabloları içerir:

- **user** - Sistem kullanıcıları
- **role** - Kullanıcı rolleri
- **customer** - Müşteri bilgileri
- **customer_note** - Müşteri notları
- **customer_file** - Müşteri dosyaları
- **sales** - Satış kayıtları
- **product** - Ürün bilgileri
- **payment** - Ödeme kayıtları
- **meeting** - Toplantı bilgileri
- **country/state/city** - Konum bilgileri
- **status** - Durum tanımları
- **language** - Dil seçenekleri

## Geliştirme

### Yeni Modül Ekleme

1. Modül klasörü oluşturun:
```bash
mkdir -p src/modules/yeni-modul/{entities,dto,repositories,services,controllers}
```

2. Entity oluşturun (CustomBaseEntity'den extend edin)
3. Repository oluşturun (BaseRepositoryAbstract'tan extend edin)
4. Service oluşturun (BaseService'den extend edin)
5. Controller ve DTO'ları oluşturun
6. Module dosyasını oluşturun
7. Ana modüle ekleyin

### Build

```bash
npm run build
```

### Test

```bash
npm run test
```

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun
3. Değişikliklerinizi commit edin
4. Branch'i push edin
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altındadır.
