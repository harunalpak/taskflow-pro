# GitHub'a Yükleme Rehberi

Bu projeyi GitHub'a yüklemek için aşağıdaki adımları takip edin:

## 1. GitHub'da Yeni Repository Oluşturma

1. GitHub'a giriş yapın: https://github.com
2. Sağ üstteki **"+"** butonuna tıklayın
3. **"New repository"** seçin
4. Repository bilgilerini doldurun:
   - **Repository name**: `taskflow-pro` (veya istediğiniz isim)
   - **Description**: "Production-like task management platform built with Node.js, Express, TypeScript, React, and Next.js"
   - **Visibility**: Public veya Private seçin
   - **ÖNEMLİ**: "Initialize this repository with a README" seçeneğini **İŞARETLEMEYİN**
   - "Add .gitignore" ve "Choose a license" seçeneklerini de boş bırakın (zaten var)
5. **"Create repository"** butonuna tıklayın

## 2. Projeyi Git ile Başlatma

Proje klasöründe terminal açın ve şu komutları çalıştırın:

```bash
# Git repository'sini başlat (eğer daha önce başlatılmadıysa)
git init

# Tüm dosyaları staging area'ya ekle
git add .

# İlk commit'i yap
git commit -m "Initial commit: TaskFlow Pro - Complete task management platform

- Backend: Express + TypeScript with modular architecture
- Frontend: Next.js 14 App Router + React + TypeScript
- Features: JWT auth, Google OAuth, Projects, Tasks, Reports
- Infrastructure: PostgreSQL, Redis, Worker Threads
- Security: Rate limiting, input validation, error handling"

# Ana branch'i main olarak ayarla
git branch -M main
```

## 3. GitHub Repository'sine Bağlama

GitHub'da oluşturduğunuz repository'nin sayfasında gösterilen komutları kullanın:

```bash
# Remote repository ekle (YOUR_USERNAME ve REPO_NAME'i değiştirin)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Veya SSH kullanıyorsanız:
# git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git
```

## 4. Dosyaları GitHub'a Yükleme

```bash
# Dosyaları GitHub'a push et
git push -u origin main
```

## 5. GitHub Actions CI/CD (Otomatik)

CI/CD workflow'u otomatik olarak çalışacaktır. İlk push'tan sonra:
- `.github/workflows/ci.yml` dosyası otomatik olarak algılanır
- Her push ve pull request'te testler çalışır
- GitHub Actions sekmesinden durumu takip edebilirsiniz

## 6. Repository Ayarları (Önerilen)

GitHub repository sayfasında:

1. **Settings** > **Secrets and variables** > **Actions**
   - Gerekirse test için environment variables ekleyin

2. **Settings** > **General**
   - Description ekleyin
   - Topics ekleyin: `nodejs`, `typescript`, `express`, `nextjs`, `task-management`, `prisma`, `redis`, `jwt`, `oauth`

3. **Settings** > **Pages** (opsiyonel)
   - Frontend'i deploy etmek isterseniz Pages ayarlarını yapın

## 7. README Badge'lerini Güncelleme (Opsiyonel)

`README.md` dosyasındaki badge URL'lerini kendi repository'nize göre güncelleyin:

```markdown
[![CI](https://github.com/YOUR_USERNAME/taskflow-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/taskflow-pro/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

## Önemli Notlar

⚠️ **Güvenlik**:
- `.env` dosyaları `.gitignore`'da olduğu için yüklenmeyecek ✅
- `.env.sample` dosyaları yüklenecek (bunlar güvenli) ✅
- GitHub Secrets kullanarak production secrets'ları saklayın

✅ **Yüklenen Dosyalar**:
- Tüm kaynak kod
- README, LICENSE
- GitHub workflows ve templates
- Documentation dosyaları
- `.env.sample` dosyaları

❌ **Yüklenmeyen Dosyalar**:
- `node_modules/` (herkes kendi yüklemeli)
- `.env` dosyaları (güvenlik)
- Build çıktıları (`dist/`, `.next/`)
- IDE ayarları
- Log dosyaları

## Sorun Giderme

### "Permission denied" hatası alıyorsanız:
```bash
# SSH key'inizi GitHub'a eklediğinizden emin olun
# Veya HTTPS kullanın ve Personal Access Token kullanın
```

### "Repository not found" hatası:
- Repository URL'ini kontrol edin
- GitHub'da repository'nin var olduğundan emin olun
- Erişim izinlerinizi kontrol edin

### CI/CD çalışmıyorsa:
- `.github/workflows/ci.yml` dosyasının doğru yerde olduğundan emin olun
- GitHub Actions'ın repository'de aktif olduğunu kontrol edin
- Settings > Actions > General'da Actions'ın enable olduğundan emin olun

## Sonraki Adımlar

1. ✅ Repository'yi oluşturduk
2. ✅ İlk commit'i yaptık
3. ✅ GitHub'a push ettik
4. 🔄 CI/CD workflow'ları çalışıyor
5. 📝 Issue ve PR template'leri hazır
6. 🤖 Dependabot dependency güncellemelerini kontrol edecek

Başarılar! 🚀

