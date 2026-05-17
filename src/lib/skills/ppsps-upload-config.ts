/** Configuration upload — Skill PPSPS (mêmes règles que CCTP). */
export {
  CCTP_UPLOAD_MAX_BYTES as PPSPS_UPLOAD_MAX_BYTES,
  CCTP_MAX_REFERENCE_FILES as PPSPS_MAX_REFERENCE_FILES,
  CCTP_EXTRACT_MAX_CHARS as PPSPS_EXTRACT_MAX_CHARS,
  CCTP_ACCEPTED_FORMATS_HINT as PPSPS_ACCEPTED_FORMATS_HINT,
  formatFileSize,
  getCctpFileCategory as getPpspsFileCategory,
  isCctpFileAccepted as isPpspsFileAccepted,
} from "@/lib/skills/cctp-upload-config";
