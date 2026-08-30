# Task 8: File Upload System & Image Processing - ✅ COMPLETED

**Date:** August 30, 2026  
**Status:** ✅ All 7 subtasks completed and verified

---

## Summary

Task 8 completes the reusable image-upload system for the FTI Newcomer Portal. The backend now uses one secure Multer/Sharp/Cloudinary pipeline for employee profile images, intern profile images, and intern-batch group photos. Uploads are validated by MIME type, size, binary signature, and dimensions, normalized to 400×400 WebP thumbnails, and cleaned up when records are replaced or deleted.

The frontend now provides a shared `ImageUpload` component with local validation, object-URL previews, existing-image display, removal handling, upload progress, and broken-image fallbacks. Employee, intern, and batch forms/services/hooks/pages all use the shared workflow.

---

## Completed Work

### ✅ Reusable backend upload pipeline

**Files:**

- `server/src/config/upload.js`
- `server/src/config/cloudinary.js`
- `server/src/middleware/imageUpload.js`
- `server/src/utils/imageUpload.js`

Implemented:

- Multer memory storage so temporary files are not left on the application filesystem.
- Allowed MIME types: `image/jpeg`, `image/png`, and `image/webp`.
- Dynamic `MAX_FILE_SIZE` resolution after environment loading.
- Hard maximum of 5MB for abuse and resource protection, even if an environment value is higher.
- Sharp binary/signature validation rather than trusting the browser-supplied MIME type.
- Maximum width and height of 5000px.
- EXIF orientation correction.
- Exact 400×400 thumbnail output using crop/cover processing.
- WebP normalization at quality 85.
- Cloudinary upload with image resource type and WebP format.
- Best-effort Cloudinary deletion with cleanup failures logged without failing an already-successful database operation.
- Consistent API errors for Multer, invalid binary data, invalid dimensions, unavailable Cloudinary configuration, and upload-service failures.

The Cloudinary implementation is environment-based and remains compatible with cloud deployment. No storage credentials are exposed to the client.

### ✅ Employee upload integration

**Files:**

- `server/src/routes/employees.js`
- `server/src/controllers/employeeController.js`
- `client/src/services/employeeService.js`
- `client/src/hooks/useEmployees.js`
- `client/src/components/employees/EmployeeForm.jsx`
- `client/src/pages/Employees.jsx`

Employee create and update routes accept `profileImage` multipart uploads. Employee image fields are controller-owned and excluded from normal client payload whitelists, preventing arbitrary URL or Cloudinary public-ID assignment.

Implemented lifecycle behavior:

- Upload a profile image during employee creation.
- Upload a replacement image during employee update.
- Keep the new asset after the database save succeeds.
- Delete the previous asset after successful replacement persistence.
- Delete the employee's stored asset on employee deletion.
- Clean up a newly uploaded asset when persistence fails before a record is created or saved.
- Preserve employee profile-image URLs in list and detail responses.

### ✅ Intern and batch cleanup integration

**Files:**

- `server/src/controllers/internController.js`
- `server/src/controllers/internBatchController.js`
- `server/src/routes/interns.js`
- `server/src/routes/internBatches.js`
- `client/src/services/internService.js`
- `client/src/services/internBatchService.js`
- `client/src/hooks/useInterns.js`
- `client/src/hooks/useInternBatches.js`
- `client/src/components/interns/InternForm.jsx`
- `client/src/components/interns/BatchForm.jsx`
- `client/src/pages/Interns.jsx`
- `client/src/pages/InternBatches.jsx`
- `client/src/pages/InternDetail.jsx`
- `client/src/pages/InternBatchDetail.jsx`

The existing Task 7 upload integration was refactored to use the shared pipeline. Intern profile images and batch group photos now have the same validation, processing, replacement, deletion, and failure cleanup behavior as employee images.

### ✅ Reusable frontend upload and fallback UI

**File:** `client/src/components/common/ImageUpload.jsx`

Added:

- Browser MIME validation for JPG, PNG, and WebP.
- Browser-side 5MB limit validation.
- Browser image decoding and 5000px dimension validation before submission.
- Object-URL preview creation and revocation to prevent browser memory leaks.
- Existing remote-image display for edit forms.
- Remove/replace handling.
- Upload progress bar and percentage display.
- Inline validation and server-error messaging.
- `ImageWithFallback` for missing or broken remote images, with initials/placeholder content.

### ✅ Multipart services and query integration

**Files:**

- `client/src/services/apiClient.js`
- `client/src/services/employeeService.js`
- `client/src/services/internService.js`
- `client/src/services/internBatchService.js`
- `client/src/hooks/useEmployees.js`
- `client/src/hooks/useInterns.js`
- `client/src/hooks/useInternBatches.js`

Updated client requests to:

- Use JSON for normal CRUD requests.
- Use `FormData` only when a file is present.
- Let Axios/browser networking generate the multipart boundary instead of manually setting `Content-Type`.
- Forward `onUploadProgress` to the upload request.
- Invalidate related employee, intern, batch, and department queries after mutations.

---

## Verification

### ✅ Live backend verification

A temporary live API harness was created, executed, and deleted. It used the seeded local `admin` and `staff` accounts and removed all temporary records in cleanup. The harness passed all requested upload and lifecycle checks:

- Admin login and staff login.
- Temporary batch creation with a valid PNG group photo.
- Temporary employee creation with a valid JPEG profile image.
- Employee replacement upload with a valid WebP image.
- Employee list and detail responses containing the replacement image URL.
- Temporary intern creation with a valid PNG profile image.
- Batch replacement upload with a valid WebP group photo.
- Upload larger than 5MB rejected with HTTP 400.
- PDF/non-image upload rejected with HTTP 400.
- Invalid bytes disguised as `image/png` rejected with HTTP 400.
- Image exceeding the 5000px dimension limit rejected with HTTP 400.
- Staff employee upload denied with HTTP 403.
- Employee deletion succeeded, triggered the cleanup path, and subsequent detail access returned HTTP 404.
- Intern deletion succeeded, triggered the cleanup path, and subsequent detail access returned HTTP 404.
- Batch deletion succeeded, triggered the cleanup path, and subsequent detail access returned HTTP 404.
- Temporary employee, intern, batch, and associated uploaded assets were handled through the replacement/deletion cleanup paths; no temporary database records remained.

Cloudinary cleanup is intentionally best-effort by design. The live verification exercised the application cleanup calls after replacement and deletion; it did not use a separate Cloudinary Admin API lookup to inspect remote resource state.

### ✅ Vite proxy verification

Through the Vite development server on its fallback port `5174`:

- `GET /` returned the Vite application with HTTP 200.
- `GET /api/health` was proxied to the backend and returned HTTP 200 with the server health response.

### ✅ Client build

From `client`:

```text
npm run build
✓ 172 modules transformed.
✓ built successfully with no errors
```

### ✅ Backend syntax/runtime checks

- The live server started successfully on port 5000.
- MongoDB connected successfully to the configured development database.
- The complete live upload harness passed.
- Temporary verification harness and development servers were removed/stopped after validation.

---

## Design Decisions

1. **One shared upload pipeline.** Employee, intern, and batch uploads use the same security and processing rules, preventing divergent validation behavior.
2. **400×400 WebP output.** This follows the Task 8 thumbnail requirement and gives the frontend a predictable image size and format.
3. **MIME plus binary validation.** Browser MIME values are treated as hints; Sharp validates that the bytes are actually an image.
4. **Dynamic configuration with a hard cap.** Environment values are read after dotenv initialization, while the 5MB maximum remains enforced for resource protection.
5. **Replacement sequencing protects database references.** New assets are retained after a successful save; old assets are deleted only after persistence succeeds.
6. **Cleanup is best-effort.** A remote Cloudinary outage does not turn a successful database deletion into an API failure.
7. **Multipart boundaries are browser-owned.** The client does not manually set multipart `Content-Type`, allowing Axios/fetch to generate the correct boundary.
8. **Frontend validation is additive, not authoritative.** Browser checks improve feedback and reduce wasted uploads, while the backend repeats all security-sensitive validation.
9. **Storage identifiers remain server-only.** Cloudinary public IDs are selected only where cleanup is needed and are not exposed in normal API payloads.

---

## Files Added or Refactored for Task 8

```text
client/src/components/common/ImageUpload.jsx
server/src/config/upload.js
server/src/config/cloudinary.js
server/src/middleware/imageUpload.js
server/src/utils/imageUpload.js
```

Task 8 also updated the existing employee, intern, batch, service, hook, form, and page files listed in the sections above. Task 7 upload files were refactored in place rather than duplicated.

---

**Task 8 Status:** ✅ **COMPLETE**  
**Next Task:** Task 9
