# SmartStay API Documentation (EXE101)

Base URL: `http://localhost:5000`

---

## 1. Quản lý phòng trọ (Rooms)

### 1.1. Lấy danh sách phòng trọ (kèm bộ lọc)
* **URL:** `/api/rooms`
* **Method:** `GET`
* **Query Parameters (Tùy chọn):**
  * `campus`: Lọc theo trường (vd: `FPT Can Tho`)
  * `maxPrice`: Ngân sách tối đa (vd: `3000000`)
  * `electricityCostType`: Loại giá điện (`nha_nuoc`, `kinh_doanh`, `gia_co_dinh`)
  * `isSafeBadge`: Lọc phòng uy tín (`true` / `false`)
* **Response:**
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "6aad186f1f34d48876cf6362",
      "title": "Phòng trọ cao cấp gần ĐH FPT Cần Thơ",
      "address": "Khu dân cư Hồng Phát, An Bình, Ninh Kiều, Cần Thơ",
      "campus": "FPT Can Tho",
      "price": 2500000,
      "images": ["[https://images.unsplash.com/photo-1522708323590-d24dbb6b0267](https://images.unsplash.com/photo-1522708323590-d24dbb6b0267)"],
      "contactPhone": "0901234567",
      "electricityCostType": "nha_nuoc",
      "waterCost": "Theo giá nhà nước",
      "hasSeparateMeter": true,
      "depositMonths": 1,
      "extraFees": { "wifi": 50000, "trash": 30000, "parking": 0 },
      "isSafeBadge": true
    }
  ]
}

### 1.2. Xem chi tiết phòng trọ

* **URL:** `/api/rooms/:id`
* **Method:** `GET`

### 1.3. Đăng phòng trọ mới

* **URL:** `/api/rooms`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`

---

## 2. Tìm bạn cùng phòng (Roommate Matcher)

### 2.1. Lưu hồ sơ khảo sát

* **URL:** `/api/surveys`
* **Method:** `POST`
* **Body:**

{
  "name": "Nguyễn Văn A",
  "contactZalo": "0901234567",
  "campus": "FPT Can Tho",
  "gender": "Nam",
  "sleepSchedule": "night_owl",
  "cleanliness": "daily",
  "smokingDrinking": "none",
  "guestPolicy": "ask_first",
  "budgetRange": "medium"
}


### 2.2. Tìm người tương thích nhất

* **URL:** `/api/surveys/matches/:id`
* **Method:** `GET`
* **Mô tả:** Trả về danh sách ứng viên sắp xếp theo % tương thích (mỗi tiêu chí trùng khớp đóng góp +20%).


## 3. Đánh giá & Minh bạch chi phí (Reviews)

### 3.1. Lấy đánh giá của một phòng trọ

* **URL:** `/api/reviews/room/:roomId`
* **Method:** `GET`
* **Response:**

{
  "success": true,
  "roomId": "6aad186f1f34d48876cf6362",
  "stats": {
    "totalReviews": 2,
    "avgRating": 4.5,
    "costAccuracyRate": "100%"
  },
  "data": [ ... ]
}


### 3.2. Gửi đánh giá phòng

* **URL:** `/api/reviews`
* **Method:** `POST`
* **Body:**

{
  "room": "6aad186f1f34d48876cf6362",
  "studentName": "Đặng Tuấn Kiệt",
  "rating": 5,
  "isCostAccurate": true,
  "actualMonthlyCost": 2850000,
  "comment": "Phòng đúng giá niêm yết, đồng hồ riêng rõ ràng."
}
