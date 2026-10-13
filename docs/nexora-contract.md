# قرارداد اتصال Nexora

این قرارداد در تاریخ `2026-10-13` با خواندن کد بک‌اند بررسی شد. هیچ فایل `.env` خوانده نشد و پروژهٔ Nexora تغییر نکرد.

منابع بررسی: `app/main.py` (پیشوند `/api/v1`)، `app/api/routes/rag.py` (مسیر `/rag/answer`)، `app/schemas/rag.py`، `app/schemas/search.py`، `app/schemas/metadata.py` و `app/api/routes/auth.py`.

درخواست: `POST /api/v1/rag/answer` با JSON. `question` بین ۲ تا ۲۰۰۰ نویسه و `limit` بین ۱ تا ۸ است (پیش‌فرض ۵). گزینه‌های محدوده شامل `document_id`، `document_set_id` و `document_ids` (حداکثر ۵۰ UUID) هستند. `filters` شامل authors، languages، source_types، tags، date_from و date_to است. تاریخ‌ها قالب ISO دارند.

احراز هویت از cookie نشست یا `Authorization: Bearer` پشتیبانی می‌کند. توکن باید به نشست فعال کاربر مربوط باشد و claimهای `sub` و `jti` معتبر داشته باشد. آداپتر فقط Bearer را از متغیر محیطی `NEXORA_TOKEN` می‌خواند و ورود خودکار انجام نمی‌دهد.

پاسخ: `response_id`، `question`، `answer`، `answer_basis` (sources/general/hybrid)، `grounded`، `sources` و `citations`. هر منبع شامل chunk_id، document_id، filename، chunk_index، content و score است. citation شامل id، chunk_id، document_id، filename، chunk_index، excerpt و score، و در صورت وجود page و section است. پاسخ کامل JSON نگهداری می‌شود؛ تغییر قرارداد باید همراه با تغییر تست‌ها باشد.

این بررسی از روی کد انجام شده است؛ اتصال به سرویس زنده در این نسخه آزمایش نشده است. آداپتر redirect را دنبال نمی‌کند و retry خودکار ندارد؛ هر مورد دقیقاً یک درخواست دارد. خطاهای HTTP با status ذخیره می‌شوند و متن خام خطا ذخیره نمی‌شود تا اطلاعات احراز هویت منعکس‌شده وارد گزارش نشود.
