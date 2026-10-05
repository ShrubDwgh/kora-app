# Kora

Komunitas, Family Space, dan chat realtime dalam satu aplikasi.

**Stack:** React 18 + Vite + TypeScript, Supabase (Auth, PostgreSQL + RLS, Realtime), deploy ke Vercel.

## Kenapa Supabase (bukan Firebase)

- Data Kora relasional (anggota, peran, konversasi, undangan). PostgreSQL menangani ini lebih natural daripada Firestore.
- Izin diperiksa di database lewat Row Level Security, bukan di frontend.
- Realtime `postgres_changes` mengikuti RLS, jadi client hanya menerima pesan yang memang boleh dibacanya.
- Auth, reset password, dan session sudah tersedia; browser hanya butuh dua variabel publik.

## Menjalankan dari awal

1. Buat project di https://supabase.com.
2. Buka **SQL Editor**, tempel dan jalankan seluruh isi `database/migrations/001_init.sql` (cukup sekali).
3. **Authentication → URL Configuration**: isi Site URL dan Redirect URLs dengan `http://localhost:5173/**` dan URL Vercel-mu (`https://nama-app.vercel.app/**`). Ini dipakai oleh konfirmasi email dan reset password.
4. Salin `.env.example` menjadi `.env`, isi dari **Project Settings → API**:
   - `VITE_SUPABASE_URL`: Project URL
   - `VITE_SUPABASE_ANON_KEY`: anon public key
   Jangan pernah memakai `service_role` key di project ini.
5. Jalankan:
   ```bash
   npm install
   npm run dev
   ```
6. Pemeriksaan sebelum rilis: `npm run typecheck` lalu `npm run build`.

## Deploy ke Vercel

1. Push project ke GitHub (`.env` sudah di-ignore).
2. Di Vercel: **Add New → Project**, pilih repo, framework **Vite**.
3. Tambahkan dua environment variable di atas, lalu **Deploy**.
4. `vercel.json` mengarahkan semua route ke `index.html`, jadi refresh halaman tidak menghasilkan 404.

## Keamanan

- RLS aktif di semua tabel `public`. Role `anon` tidak punya akses tabel; hanya `username_available` yang bisa dipanggil sebelum login.
- Aksi sensitif (buat/gabung komunitas, ubah peran, keluarkan anggota, undangan keluarga, DM, grup) hanya lewat fungsi `SECURITY DEFINER` yang memeriksa `auth.uid()`. Tabel anggota tidak punya policy insert/update langsung.
- Pesan: hanya anggota percakapan yang bisa membaca/mengirim; pengirim saja yang bisa edit/hapus; isi pesan yang dihapus dikosongkan di database.
- Pembatasan laju pesan di database: 20 pesan per 10 detik per pengguna.
- Teks dirender lewat React (otomatis di-escape), tanpa `dangerouslySetInnerHTML`. Panjang input dibatasi di database.

## Struktur data

`profiles`, `community_roles`, `communities`, `community_members`, `posts`, `comments`, `reactions`, `families`, `family_members`, `conversations`, `conversation_members`, `messages`, `attachments`, `notifications`.
Channel komunitas dan chat keluarga adalah baris `conversations` dengan `kind = 'channel'` / `'family'`, jadi semua jenis chat memakai satu alur pesan dan realtime.

## Belum ada

Pencarian global, upload file/gambar (tabel `attachments` dan RLS sudah siap, Storage belum disambungkan), UI reaction, UI pengumuman dan event keluarga, status dibaca, mention, link preview, edit info/aturan komunitas dari UI, ESLint.
