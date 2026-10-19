# API محلی NexoLab

سرور با `nexolab --serve --suite ... --config ...` اجرا می‌شود. مسیرها متعلق به NexoLab هستند؛ قرارداد Nexora همچنان در nexora-contract.md مستند است. مرورگر فقط با سرور NexoLab ارتباط دارد و سرور از آداپتر موجود برای درخواست به Nexora استفاده می‌کند.

| درخواست | رفتار |
|---|---|
| GET /api/info | مجموعهٔ آزمون و نام آداپتر تنظیم‌شده |
| GET /api/runs | فهرست اجراهای پوشهٔ خروجی |
| GET /api/compare?baseline={run_id}&candidate={run_id} | مقایسهٔ ساختاریافتهٔ دو اجرای کامل |
| POST /api/runs | شروع اجرای تنظیم‌شده؛ بدنه فقط شیء خالی JSON |
| GET /api/runs/{run_id} | وضعیت، snapshot گزارش و ارزیابی‌های دستی |
| GET /api/runs/{run_id}/report.json | گزارش اجرای اصلی |
| GET /api/runs/{run_id}/report.csv | گزارش CSV پس از پایان موفق نوشتن گزارش |
| GET /api/runs/{run_id}/reviews.json | خروجی نظرها همراه با run_id |
| PUT /api/runs/{run_id}/reviews/{case_id} | ثبت نظر یا پاک‌کردن آن با بدنهٔ null |

بدنهٔ ثبت نظر شامل answer_correct و sources_correct از نوع boolean و notes از نوع رشته با حداکثر ۱۰۰۰۰ نویسه است. زمان reviewed_at در سرور ثبت می‌شود. review فقط برای موردی که نتیجهٔ اجرا دارد پذیرفته می‌شود. نتیجهٔ اصلی تغییر نمی‌کند.

شروع اجرا وضعیت HTTP 202 و run_id می‌دهد. GET وضعیت running، completed، failed یا interrupted را برمی‌گرداند. completed یعنی پردازش همهٔ موارد و تولید فایل‌ها تمام شده؛ خطای پاسخ‌گویی یک مورد همچنان در report.results ثبت می‌شود و الزاماً وضعیت کل اجرا را failed نمی‌کند. تعارض اجرای هم‌زمان HTTP 409 دارد. ورودی نامعتبر 400، درخواست cross-origin یا بدون header لازم 403، فایل ناموجود 404 و خطای ذخیره‌سازی 500 دارد. جزئیات استثنا، header احراز هویت و متن خام خطای Nexora در API منعکس نمی‌شوند.

مقایسه فقط دو اجرای completed را می‌پذیرد. برای هر مورد، تغییر پاسخ، فهرست منابع/ارجاع‌ها، خطا و اختلاف زمان را گزارش می‌کند؛ امتیاز کیفیت تولید نمی‌شود. پاسخ مقایسه هش مجموعه و پیکربندی و revisionهای ثبت‌شده را هم نشان می‌دهد. برای داده‌های قدیمی که provenance ندارند، `same_config` برابر false است.

درخواست‌های POST و PUT باید Content-Type: application/json و X-NexoLab-Request: 1 داشته باشند. بدنه حداکثر ۶۴ کیلوبایت است. Host باید origin آدرس 127.0.0.1 و پورت واقعی سرور باشد؛ Origin در صورت وجود باید همان origin باشد. سرور CORS ندارد، فقط loopback است و جایگزین احراز هویت سرویس عمومی نیست. انتخاب مسیر فایل، base_url یا توکن از بدنهٔ مرورگر پذیرفته نمی‌شود.

فایل‌های زیرساخت HTTP و نگهداری job و ارزیابی در adapters/web هستند. web.py و bootstrap.py اجزای واقعی را متصل می‌کنند. هستهٔ domain و application به HTTP وابسته نیستند. قفل مشترک ذخیره‌ساز job و خواندن API مانع تداخل replace فایل و خواندن آن در Windows می‌شود.
