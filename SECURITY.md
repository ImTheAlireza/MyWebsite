# Security deployment notes

## Required on the hosting account

1. Back up `data/admin.json`, `data/content.json`, `.env` and uploads outside the web root before deployment. Do not commit these files.
2. Upgrade the hosting runtime from PHP 5.6 to a currently supported PHP 8.x release. Syntax compatibility is not a substitute for a maintained runtime. Enable Fileinfo and GD; missing Fileinfo deliberately disables uploads.
3. Configure HTTPS at the origin. The production redirect targets `alirezashabanzadeh.ir`; adapt it if you deploy to another hostname. If TLS terminates at a reverse proxy, configure HTTPS detection at the trusted server/proxy layer to avoid redirect loops. Do not trust arbitrary forwarded headers from clients.
4. Keep your existing custom admin credentials. Existing custom legacy password hashes are upgraded after a successful login. The known `admin1234` password and the example environment password are rejected. For recovery or a fresh install, set `ADMIN_USERNAME` and a unique password of at least 12 characters in `.env` (outside the web root when possible). Environment credentials override `data/admin.json`. No default account is created.
5. Remove the old public `php-error.log`; configure PHP `log_errors=On`, `display_errors=Off`, `expose_php=Off` and an error log outside the web root. Review old logs for secrets; rotate any credentials actually exposed.
6. Apache/LiteSpeed must apply `.htaccess`, including in `uploads/` and `data/`. Nginx needs equivalent server rules. Deny executable/active content in uploads regardless of handler configuration. Existing SVG uploads are intentionally blocked and should be converted to raster images. New SVG uploads are rejected.
7. Keep `data/` writable by PHP but not other users. Rate-limit storage errors fail closed (requests are refused rather than unprotected). The limiter uses 4096 bounded buckets and atomic locks; collisions can share limits. It is not distributed anti-DDoS protection. Use an edge/WAF limiter for multiple servers and volumetric attacks.
8. Configure PHP/web-server request limits (e.g. `upload_max_filesize=100M`, `post_max_size=110M`, `max_file_uploads=10`) and resource/time limits. Application upload limits are 10 MiB for raster images/PDFs and 100 MiB for videos, with a 24-million-pixel image cap. MIME validation does not replace malware scanning for documents/videos.

## After pulling

- Check homepage, images, videos, admin login, password change, logout and contact submission.
- Ensure `/.env`, `/.git/config`, `/data/admin.json`, `/php-error.log` and executable upload paths return 403/404 without file content.
- Confirm HTTPS redirect and security headers. HSTS intentionally excludes subdomains; enable it there only once they all support HTTPS.
- Existing admin sessions will require a new login. Sessions expire after 30 minutes idle or 8 hours total. Cookies use HttpOnly, SameSite=Lax and Secure when HTTPS is detected.
- The enforced CSP restricts resources and disables objects, foreign form targets and framing by other origins. Inline script/style remain permitted for current templates; this is not a fully strict nonce-based CSP. Review browser console after deployment, especially if media are hosted externally.
- Optional defence in depth: hosting-level BasicAuth/IP restriction or MFA for `/admin/`, edge bot protection, automated external backups and malware scanning.

## Verification performed in the development workspace

All tracked PHP files were syntax-parsed for PHP 5.6 compatibility with `php-parser`; frontend JavaScript passed `node --check`; `git diff --check` passed. PHP CLI is unavailable in this workspace: PHP execution, GD/Fileinfo behaviour, Apache/LiteSpeed rules and end-to-end integration must be verified on staging/the hosting server. This is targeted hardening, not a guarantee of security or a completed penetration test.
