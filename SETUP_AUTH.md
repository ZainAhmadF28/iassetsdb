# Setup Autentikasi dan Preloader - iassetsdb

## Daftar Fitur Baru

✅ **Preloader**: Ditampilkan saat halaman pertama kali diakses dengan animasi loading yang menarik (mirip dengan mobile app)  
✅ **Halaman Login**: Halaman login yang elegan dengan validasi email dan password  
✅ **Role-Based Access**: Hanya user dengan role `admin` yang dapat login  
✅ **Session Management**: Automatic redirect ke login jika session expired atau user logout  
✅ **User Navigation**: Dropdown menu untuk melihat profil dan logout  

---

## Setup Awal

### 1. Seeding Database dengan Admin User

Jalankan command berikut untuk membuat user admin default:

```bash
npm run db:push
npm run db:seed
```

**Default Credentials:**
- Email: `admin@smbr.com`
- Password: `admin123`

⚠️ **PENTING**: Ganti password default segera setelah setup!

### 2. Menjalankan Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3002`

---

## Alur Login

1. Buka `http://localhost:3002` atau halaman manapun
2. Preloader akan muncul saat halaman loading
3. Jika belum login → automatic redirect ke `/login`
4. Masukkan email dan password (hanya admin yang bisa login)
5. Setelah login sukses → redirect ke dashboard
6. User info ditampilkan di top-right corner

---

## Struktur File Baru

```
iassetsdb/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Updated: Root layout dengan AuthProvider
│   │   ├── layout-client.tsx             # NEW: Client layout dengan preloader & routing
│   │   ├── login/
│   │   │   └── page.tsx                  # NEW: Login page
│   │   ├── api/auth/
│   │   │   ├── login/route.ts            # NEW: Login API endpoint
│   │   │   ├── me/route.ts               # NEW: Get current user endpoint
│   │   │   └── logout/route.ts           # NEW: Logout endpoint
│   ├── components/
│   │   ├── Preloader.tsx                 # NEW: Preloader component
│   │   ├── UserNav.tsx                   # NEW: User navigation dropdown
│   │   └── Sidebar.tsx                   # Existing: Navigation sidebar
│   ├── context/
│   │   └── AuthContext.tsx               # NEW: Auth context provider
│   └── lib/
│       └── auth.ts                       # NEW: Auth utilities (hashing, etc)
├── middleware.ts                         # NEW: Protected routes middleware
├── prisma/
│   ├── schema.prisma                     # Existing: Database schema
│   └── seed.ts                           # NEW: Database seeding script
└── package.json                          # Updated: Added scripts
```

---

## Komponen Utama

### AuthContext (`src/context/AuthContext.tsx`)
Mengelola state autentikasi global:
- `user` - Data user yang sedang login
- `isLoggedIn` - Boolean status login
- `loading` - Status loading saat cek auth
- `login(email, password)` - Function untuk login
- `logout()` - Function untuk logout

### RootLayoutClient (`src/app/layout-client.tsx`)
Client wrapper yang menangani:
- Menampilkan Preloader saat loading
- Redirect ke login jika belum autentikasi
- Redirect dari login ke home jika sudah login

### Preloader (`src/components/Preloader.tsx`)
Komponen preloader dengan:
- Logo SMBR di tengah
- Animated spinner
- Text "Memuat..."

### UserNav (`src/components/UserNav.tsx`)
Dropdown menu user dengan:
- User avatar dengan initial
- User name dan role
- Tombol logout

---

## Integrasi ke Dashboard

Untuk menambahkan user navigation ke dashboard, tambahkan komponen di bagian atas halaman:

```tsx
import UserNav from "@/components/UserNav";

export default function Dashboard() {
  return (
    <div>
      {/* Header dengan UserNav */}
      <div className="flex justify-between items-center p-4">
        <h1>Dashboard</h1>
        <UserNav />
      </div>
      
      {/* Konten dashboard */}
      {/* ... */}
    </div>
  );
}
```

---

## API Endpoints

### POST `/api/auth/login`
Login dengan email dan password
```json
{
  "email": "admin@smbr.com",
  "password": "admin123"
}
```
Response: User data + httpOnly session cookie

### GET `/api/auth/me`
Get current user (memerlukan session cookie)
Response: User data atau 401 Unauthorized

### POST `/api/auth/logout`
Logout dan clear session cookie
Response: Success message

---

## Security Notes

1. **Password Hashing**: Password di-hash menggunakan SHA256. Lebih baik gunakan bcrypt di production
2. **Session Storage**: Saat ini menggunakan in-memory (akan hilang jika server restart). Gunakan Redis/database di production
3. **HTTPS**: Pastikan gunakan HTTPS di production untuk melindungi session cookies
4. **Environment Variables**: 
   - `PASSWORD_SALT` - Untuk hashing password (set di `.env.local`)
   - `NODE_ENV` - Automatic secure mode di production

---

## Customization

### Mengubah Logo Preloader
Edit `src/components/Preloader.tsx`:
```tsx
<img src="/logoSMBR.png" alt="Logo" />
```

### Mengubah Warna Preloader
Edit class Tailwind di `Preloader.tsx`:
```tsx
<div className="fixed inset-0 bg-white"> {/* Background color */}
<circle stroke="#135d3a" /> {/* Spinner color */}
```

### Mengubah Halaman Login
Edit `src/app/login/page.tsx` untuk customize form, warna, atau layout

### Menambah Public Routes
Edit `src/app/layout-client.tsx` dan `middleware.ts`:
```tsx
const publicRoutes = ["/login", "/about", "/contact"];
```

---

## Troubleshooting

### Preloader tidak muncul
- Clear browser cache
- Restart dev server: `npm run dev`

### Login tidak bekerja
- Pastikan database sudah di-seed: `npm run db:seed`
- Check database connection di `.env.local`
- Lihat console untuk error messages

### Session tidak bertahan
- Session disimpan in-memory, akan hilang jika server restart
- Implementasikan database atau Redis session store untuk production

### CORS Error
Jika ada error CORS, pastikan API request menggunakan:
```tsx
credentials: "include" // untuk mengirim session cookie
```

---

## Next Steps

1. ✅ Implementasikan password change functionality
2. ✅ Tambahkan forgot password feature
3. ✅ Implementasikan session store dengan Redis
4. ✅ Implementasikan rate limiting untuk login attempts
5. ✅ Tambahkan logging untuk security audit trail

---

## Support

Untuk pertanyaan atau issue, hubungi tim development atau cek dokumentasi Next.js dan Prisma.
