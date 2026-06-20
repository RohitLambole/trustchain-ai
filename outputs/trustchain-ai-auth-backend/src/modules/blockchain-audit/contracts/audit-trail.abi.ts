export const AuditTrailAbi = [
  "function recordAudit(bytes32 auditId, bytes32 userId, bytes32 eventType, uint8 riskLevel, bytes32 eventHash) external",
  "function getAudit(bytes32 auditId) view returns (tuple(bytes32 auditId, bytes32 userId, bytes32 eventType, uint8 riskLevel, bytes32 eventHash, uint256 timestamp, address writer, bool exists))",
  "function verifyAudit(bytes32 auditId, bytes32 expectedEventHash) view returns (bool)",
  "function auditCount() view returns (uint256)",
  "function getAuditIdAt(uint256 index) view returns (bytes32)",
  "function backendWriters(address writer) view returns (bool)",
  "event AuditRecorded(bytes32 indexed auditId, bytes32 indexed userId, bytes32 indexed eventType, uint8 riskLevel, bytes32 eventHash, uint256 timestamp, address writer)"
] as const;
