# Proposal Section API Documentation

API ini digunakan untuk manajemen konten dinamis pada halaman About (dan section lain di masa depan) melalui endpoint RESTful. Konten disimpan di database dan dapat diubah tanpa mengedit kode program.

## Endpoint Prefix

Semua endpoint berada di bawah prefix:

```
/api/proposal/sections/about
```

## Endpoints

### 1. List All Sections

-   **GET** `/api/proposal/sections/about`
-   **Deskripsi:** Mengambil semua section About terurut.
-   **Response:**

```json
[
  {
    "id": 1,
    "title": "Judul",
    "content": "Isi paragraf",
    "image_path": "/images/about1.png",
    "type": "text_image",
    "order": 0,
    ...
  },
  ...
]
```

### 2. Get Section by ID

-   **GET** `/api/proposal/sections/about/{id}`
-   **Deskripsi:** Mengambil detail satu section berdasarkan ID.

### 3. Create Section

-   **POST** `/api/proposal/sections/about`
-   **Body:**

```json
{
    "title": "Judul",
    "content": "Isi paragraf",
    "image_path": "/images/about1.png",
    "type": "text|image|text_image|image_text",
    "order": 0
}
```

-   **Deskripsi:** Menambah section baru.

### 4. Update Section

-   **PUT** `/api/proposal/sections/about/{id}`
-   **Body:** Sama seperti create.
-   **Deskripsi:** Update data section tertentu.

### 5. Delete Section

-   **DELETE** `/api/proposal/sections/about/{id}`
-   **Deskripsi:** Hapus section berdasarkan ID.

### 6. Reorder Sections

-   **PATCH** `/api/proposal/sections/about/reorder`
-   **Body:**

```json
{
    "order": [3, 1, 2]
}
```

-   **Deskripsi:** Mengatur ulang urutan section berdasarkan array ID.

## Validasi & Keamanan

-   Semua input tervalidasi (panjang teks, tipe data, enum type).
-   Tidak menerima HTML/script berbahaya.

## Catatan

-   Endpoint ini dapat dikembangkan untuk section lain dengan menambah controller dan prefix baru.
-   Konten About akan langsung tampil di frontend (React) setelah perubahan.

---

**Author:** Tim Pengembang CRM Liz Company
**Tanggal:** 21 Desember 2025
