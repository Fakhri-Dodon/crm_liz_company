# Sections API Documentation

API ini digunakan untuk manajemen konten dinamis berbagai section (about, contact, faq, dll) melalui endpoint RESTful. Semua data section disimpan dalam satu tabel dan dibedakan dengan kolom `section_name`.

## Endpoint Prefix

Semua endpoint berada di bawah prefix:

```
/api/proposal/sections
```

## Endpoints

### 1. List All Sections
- **GET** `/api/proposal/sections`
- **Query (opsional):** `section_name=about` (atau contact, faq, dll)
- **Deskripsi:** Mengambil semua section, bisa difilter per jenis section.

### 2. Get Section by ID
- **GET** `/api/proposal/sections/{id}`
- **Deskripsi:** Mengambil detail satu section berdasarkan ID.

### 3. Create Section
- **POST** `/api/proposal/sections`
- **Body:**
```json
{
  "section_name": "about",
  "title": "Judul",
  "content": "Isi paragraf",
  "image_path": "/images/about1.png",
  "type": "text|image|text_image|image_text",
  "order": 0
}
```
- **Deskripsi:** Menambah section baru.

### 4. Update Section
- **PUT** `/api/proposal/sections/{id}`
- **Body:** Sama seperti create.
- **Deskripsi:** Update data section tertentu.

### 5. Delete Section
- **DELETE** `/api/proposal/sections/{id}`
- **Deskripsi:** Hapus section berdasarkan ID.

### 6. Reorder Sections
- **PATCH** `/api/proposal/sections/reorder`
- **Body:**
```json
{
  "order": [3,1,2]
}
```
- **Deskripsi:** Mengatur ulang urutan section berdasarkan array ID.

## Validasi & Keamanan
- Semua input tervalidasi (panjang teks, tipe data, enum type, section_name wajib).
- Tidak menerima HTML/script berbahaya.

## Catatan
- Section_name bisa diisi: about, contact, faq, dsb.
- Endpoint ini fleksibel untuk berbagai jenis section.

---

**Author:** Tim Pengembang CRM Liz Company
**Tanggal:** 21 Desember 2025
