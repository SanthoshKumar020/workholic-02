-- Per-user send time for daily job alert emails (HH:MM string, stored in IST)
alter table job_alerts add column if not exists send_time text not null default '09:00';
